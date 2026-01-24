import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare, hash } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/db';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Build providers array conditionally
const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      try {
        console.log('Auth: Starting authorization');
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          console.log('Auth: Schema validation failed', parsed.error);
          return null;
        }

        console.log('Auth: Looking up user:', parsed.data.email);
        // Only select fields that are guaranteed to exist in DB
        // (isSuperAdmin might not exist if migration hasn't run)
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            passwordHash: true,
            status: true,
          },
        });

        if (!user) {
          console.log('Auth: User not found');
          return null;
        }

        if (!user.passwordHash) {
          console.log('Auth: User has no password');
          return null;
        }

        console.log('Auth: Comparing password');
        const isValid = await compare(parsed.data.password, user.passwordHash);
        if (!isValid) {
          console.log('Auth: Password invalid');
          return null;
        }

        if (user.status !== 'ACTIVE') {
          console.log('Auth: User not active, status:', user.status);
          return null;
        }

        console.log('Auth: Success, returning user');
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      } catch (error) {
        console.error('Auth error:', error);
        return null;
      }
    },
  }),
];

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required for Vercel deployment - trust the host header
  trustHost: true,
  // Debug mode to see what's happening
  debug: process.env.NODE_ENV === 'development',
  // Note: Not using PrismaAdapter with JWT strategy + Credentials
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      try {
        console.log('JWT callback: trigger=', trigger, 'user=', !!user);

        if (user) {
          token.id = user.id;
          console.log('JWT: Set user id:', user.id);
        }

        // Handle session updates
        if (trigger === 'update' && session) {
          // Update tenant if provided
          if (session.tenantId) {
            token.tenantId = session.tenantId;
          }
          // Handle impersonation start
          if (session.impersonate && session.impersonatedUserId) {
            token.isImpersonating = true;
            token.originalUserId = token.id as string;
            token.impersonatedUserId = session.impersonatedUserId;
            // Fetch impersonated user's tenant info
            try {
              const impersonatedUser = await prisma.tenantUser.findFirst({
                where: {
                  userId: session.impersonatedUserId,
                  isActive: true,
                },
                select: {
                  tenantId: true,
                  role: true,
                },
              });
              if (impersonatedUser) {
                token.tenantId = impersonatedUser.tenantId;
                token.role = impersonatedUser.role;
              }
            } catch (error) {
              console.log('JWT: Error fetching impersonated user:', error);
            }
            console.log('JWT: Started impersonation of user:', session.impersonatedUserId);
          }
          // Handle impersonation stop
          if (session.stopImpersonation) {
            token.isImpersonating = false;
            token.impersonatedUserId = undefined;
            token.tenantId = undefined;
            token.role = undefined;
            // Restore original user ID (already in token.id for super admin)
            if (token.originalUserId) {
              token.id = token.originalUserId;
              token.originalUserId = undefined;
            }
            console.log('JWT: Stopped impersonation');
          }
        }

        // Fetch user info if not already fetched (initial login or refresh)
        if (token.id && token.isSuperAdmin === undefined) {
          console.log('JWT: Fetching user info for:', token.id);
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { isSuperAdmin: true },
            });
            token.isSuperAdmin = dbUser?.isSuperAdmin ?? false;
            console.log('JWT: isSuperAdmin=', token.isSuperAdmin);
          } catch (error) {
            // Column might not exist in DB yet - default to false
            console.log('JWT: Error fetching isSuperAdmin, defaulting to false:', error);
            token.isSuperAdmin = false;
          }
        }

        // Fetch tenant info if not present and not a super admin without tenant
        if (token.id && !token.tenantId && !token.isImpersonating) {
          console.log('JWT: Fetching tenant info for user:', token.id);
          try {
            const tenantUser = await prisma.tenantUser.findFirst({
              where: {
                userId: token.id as string,
                isActive: true,
              },
              select: {
                tenantId: true,
                role: true,
              },
            });
            if (tenantUser) {
              token.tenantId = tenantUser.tenantId;
              token.role = tenantUser.role;
              console.log('JWT: Found tenant:', tenantUser.tenantId);
            } else {
              console.log('JWT: No tenant found for user');
            }
          } catch (error) {
            console.log('JWT: Error fetching tenant info:', error);
          }
        }

        console.log('JWT: Returning token');
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      console.log('Session callback: token=', !!token);
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.role = token.role as string | undefined;
        // Super Admin fields
        session.user.isSuperAdmin = token.isSuperAdmin ?? false;
        session.user.isImpersonating = token.isImpersonating ?? false;
        session.user.impersonatedUserId = token.impersonatedUserId as string | undefined;
        session.user.originalUserId = token.originalUserId as string | undefined;
        console.log('Session: Set user data, id=', session.user.id, 'isSuperAdmin=', session.user.isSuperAdmin);
      }
      return session;
    },
    async signIn({ user, account }) {
      // Log successful sign-in (don't block login if this fails)
      try {
        if (user.id) {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'user.login',
              metadata: JSON.parse(JSON.stringify({
                provider: account?.provider || 'credentials',
              })),
            },
          });
        }
      } catch (error) {
        console.error('Failed to create login audit log:', error);
      }
      return true;
    },
  },
  events: {
    async signOut(message) {
      // Handle both session and JWT strategies
      const token = 'token' in message ? message.token : null;
      if (token?.id) {
        await prisma.auditLog.create({
          data: {
            userId: token.id as string,
            action: 'user.logout',
          },
        });
      }
    },
  },
});

// Password hashing utility
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

// Verify password utility
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}
