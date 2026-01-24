import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

const CSRF_TOKEN_NAME = 'rafit-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_MAX_AGE = 60 * 60; // 1 hour

// Generate a new CSRF token
export function generateCSRFToken(): string {
  return nanoid(CSRF_TOKEN_LENGTH);
}

// Set CSRF token in cookies
export async function setCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = generateCSRFToken();

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: '/',
  });

  return token;
}

// Get CSRF token from cookies
export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value;
}

// Validate CSRF token from request
export async function validateCSRFToken(request: Request): Promise<boolean> {
  // Skip validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(cookieToken, headerToken);
}

// Constant-time string comparison
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// Middleware to validate CSRF
export async function csrfMiddleware(request: Request): Promise<Response | null> {
  if (!(await validateCSRFToken(request))) {
    return new Response(
      JSON.stringify({ error: 'CSRF token validation failed' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  return null;
}

// Client-side helper to get CSRF token for requests
export function getCSRFHeader(token: string): Record<string, string> {
  return { [CSRF_HEADER_NAME]: token };
}
