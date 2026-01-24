import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
  '/api/health',
];

// Paths that require authentication
const protectedPaths = ['/dashboard', '/api/tenants', '/api/users', '/api/bookings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check authentication for protected paths
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtectedPath) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      // Redirect to login for page requests
      if (!pathname.startsWith('/api/')) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }

      // Return 401 for API requests
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', token.id as string);
    if (token.tenantId) {
      response.headers.set('x-tenant-id', token.tenantId as string);
    }
    if (token.role) {
      response.headers.set('x-user-role', token.role as string);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
