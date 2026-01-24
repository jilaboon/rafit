import { headers } from 'next/headers';

// In-memory rate limiting (for development)
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests in window
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Authentication endpoints
  login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 min
  register: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour
  magicLink: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour
  passwordReset: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour

  // API endpoints
  api: { windowMs: 60 * 1000, max: 100 }, // 100 per minute
  apiWrite: { windowMs: 60 * 1000, max: 30 }, // 30 writes per minute

  // Search and heavy operations
  search: { windowMs: 60 * 1000, max: 20 }, // 20 per minute
  export: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 per hour
} as const;

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: config.max - 1,
      resetTime: entry.resetTime,
    };
  }

  // Check if over limit
  if (entry.count >= config.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  };
}

// Get client IP from request headers
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    'unknown'
  );
}

// Rate limit middleware helper
export async function checkRateLimit(
  type: keyof typeof RATE_LIMITS,
  customIdentifier?: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  const ip = customIdentifier || await getClientIP();
  const identifier = `${type}:${ip}`;

  return rateLimit(identifier, config);
}

// Cleanup expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Clean up every minute
}

// Rate limit response helper
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'יותר מדי בקשות. נסה שוב מאוחר יותר.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetTime),
      },
    }
  );
}
