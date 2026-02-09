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
  '/portal/register',
  '/portal/login',
  '/api/portal/invitations',
  '/api/portal/auth',
];

// Paths that require authentication
const protectedPaths = ['/dashboard', '/api/tenants', '/api/users', '/api/bookings', '/portal', '/api/portal'];

// Paths that require super admin
const adminPaths = ['/admin', '/api/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // CSRF Protection: Verify Origin for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        const expectedHost = host.split(':')[0];
        const originHost = originUrl.hostname;

        if (originHost !== expectedHost) {
          // Exempt webhook and auth endpoints from CSRF check
          const csrfExemptPaths = ['/api/stripe/webhooks', '/api/auth'];
          const isExempt = csrfExemptPaths.some(
            (path) => pathname.startsWith(path)
          );

          if (!isExempt) {
            return NextResponse.json(
              { error: 'Cross-origin request blocked' },
              { status: 403 }
            );
          }
        }
      } catch {
        // Invalid origin URL — block the request
        return NextResponse.json(
          { error: 'Invalid origin' },
          { status: 403 }
        );
      }
    }
  }

  // Check if path is admin-only
  const isAdminPath = adminPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // Check if path requires authentication (but not super admin)
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // Handle admin paths - require super admin
  if (isAdminPath) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
    });

    if (!token) {
      if (!pathname.startsWith('/api/')) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check super admin status
    if (!token.isSuperAdmin) {
      if (!pathname.startsWith('/api/')) {
        // Redirect regular users to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    // Add user info to headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', token.id as string);
    response.headers.set('x-is-super-admin', 'true');
    if (token.isImpersonating) {
      response.headers.set('x-is-impersonating', 'true');
      response.headers.set('x-impersonated-user-id', token.impersonatedUserId as string);
      response.headers.set('x-original-user-id', token.originalUserId as string);
    }
    if (token.tenantId) {
      response.headers.set('x-tenant-id', token.tenantId as string);
    }
    if (token.role) {
      response.headers.set('x-user-role', token.role as string);
    }

    return response;
  }

  // Handle regular protected paths
  if (isProtectedPath) {
    // Use getToken - lightweight for Edge runtime
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      // Match the cookie name from auth config
      cookieName: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
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

    // Customer/Staff routing isolation
    const isPortalPath = pathname.startsWith('/portal') || pathname.startsWith('/api/portal');
    const isDashboardPath = pathname.startsWith('/dashboard');

    if (isPortalPath && !token.isCustomer) {
      // Non-customers can't access portal
      if (!pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.json({ error: 'Customer access required' }, { status: 403 });
    }

    if (isDashboardPath && token.isCustomer) {
      // Customers can't access staff dashboard
      if (!pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/portal', request.url));
      }
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', token.id as string);
    if (token.isSuperAdmin) {
      response.headers.set('x-is-super-admin', 'true');
    }
    if (token.isImpersonating) {
      response.headers.set('x-is-impersonating', 'true');
      response.headers.set('x-impersonated-user-id', token.impersonatedUserId as string);
      response.headers.set('x-original-user-id', token.originalUserId as string);
    }
    if (token.tenantId) {
      response.headers.set('x-tenant-id', token.tenantId as string);
    }
    if (token.role) {
      response.headers.set('x-user-role', token.role as string);
    }
    if (token.isCustomer) {
      response.headers.set('x-is-customer', 'true');
      response.headers.set('x-customer-id', token.customerId as string);
      response.headers.set('x-customer-tenant-id', token.customerTenantId as string);
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
