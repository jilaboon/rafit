import NextAuth, { type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
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
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
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
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      // Handle session updates
      if (trigger === 'update' && session?.tenantId) {
        token.tenantId = session.tenantId;
      }

      // Fetch tenant info if not present
      if (token.id && !token.tenantId) {
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
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.role = token.role as string | undefined;
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
