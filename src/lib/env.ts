import { z } from 'zod';

const envSchema = z.object({
  // Required secrets
  AUTH_SECRET: z
    .string({ required_error: 'AUTH_SECRET is required. Generate one with: openssl rand -base64 32' })
    .min(1, 'AUTH_SECRET cannot be empty')
    .refine(
      (val) => val !== 'your-super-secret-key-change-in-production',
      'AUTH_SECRET is still set to the example value. Generate a real secret with: openssl rand -base64 32'
    ),
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty'),

  // Optional secrets - validated if present
  ENCRYPTION_KEY: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const decoded = Buffer.from(val, 'base64');
          return decoded.length === 32;
        } catch {
          return false;
        }
      },
      'ENCRYPTION_KEY must be valid base64 encoding 32 bytes. Generate with: openssl rand -base64 32'
    ),

  // Optional - warn in production if missing
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Non-secret config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
}

// Warn about missing optional secrets in production
if (parsed.data.NODE_ENV === 'production') {
  const optionalSecrets = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ] as const;

  for (const key of optionalSecrets) {
    if (!parsed.data[key]) {
      console.warn(`[env] Warning: ${key} is not set. Related features will be unavailable.`);
    }
  }
}

export const env = parsed.data;
