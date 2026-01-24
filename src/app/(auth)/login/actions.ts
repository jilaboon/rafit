'use server';

import { signIn } from '@/lib/auth/config';
import { AuthError } from 'next-auth';

export async function loginAction(formData: FormData) {
  const callbackUrl = (formData.get('callbackUrl') as string) || '/dashboard';

  try {
    // Pass formData directly - NextAuth v5 handles extraction
    await signIn('credentials', {
      redirect: true,
      redirectTo: callbackUrl,
      email: formData.get('email'),
      password: formData.get('password'),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'אימייל או סיסמה שגויים' };
        default:
          return { error: 'אירעה שגיאה בהתחברות' };
      }
    }
    // NEXT_REDIRECT is thrown on success - must re-throw
    throw error;
  }
}
