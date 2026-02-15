import { z } from 'zod';

// Common validation patterns
const emailSchema = z
  .string()
  .email('כתובת אימייל לא תקינה')
  .max(255, 'כתובת אימייל ארוכה מדי');

const passwordSchema = z
  .string()
  .min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
  .max(128, 'הסיסמה ארוכה מדי')
  .regex(/[a-z]/, 'הסיסמה חייבת להכיל אות קטנה באנגלית')
  .regex(/[A-Z]/, 'הסיסמה חייבת להכיל אות גדולה באנגלית')
  .regex(/[0-9]/, 'הסיסמה חייבת להכיל מספר');

const nameSchema = z
  .string()
  .min(2, 'השם חייב להכיל לפחות 2 תווים')
  .max(100, 'השם ארוך מדי')
  .regex(/^[\p{L}\s'-]+$/u, 'השם מכיל תווים לא חוקיים');

const phoneSchema = z
  .string()
  .regex(
    /^(?:\+972|0)(?:[23489]|5[0-9]|77)[0-9]{7}$/,
    'מספר טלפון לא תקין'
  )
  .optional()
  .or(z.literal(''));

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'נדרשת סיסמה'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: nameSchema,
    phone: phoneSchema,
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'יש לאשר את תנאי השימוש',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Magic link request schema
export const magicLinkSchema = z.object({
  email: emailSchema,
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

// Password reset schema
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'טוקן חסר'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirmPassword'],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

// Password change schema (when already logged in)
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'נדרשת סיסמה נוכחית'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'הסיסמה החדשה חייבת להיות שונה מהנוכחית',
    path: ['newPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// Profile update schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Tenant creation schema
export const tenantCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'שם העסק חייב להכיל לפחות 2 תווים')
    .max(100, 'שם העסק ארוך מדי'),
  slug: z
    .string()
    .min(3, 'מזהה העסק חייב להכיל לפחות 3 תווים')
    .max(50, 'מזהה העסק ארוך מדי')
    .regex(/^[a-z0-9-]+$/, 'מזהה העסק יכול להכיל רק אותיות קטנות באנגלית, מספרים ומקפים')
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
      message: 'מזהה העסק לא יכול להתחיל או להסתיים במקף',
    }),
  phone: phoneSchema,
  email: emailSchema.optional(),
});

export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;

// User invite schema
export const userInviteSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  role: z.enum(['ADMIN', 'REGIONAL_MANAGER', 'MANAGER', 'COACH', 'FRONT_DESK', 'ACCOUNTANT', 'READ_ONLY']),
});

export type UserInviteInput = z.infer<typeof userInviteSchema>;
