'use server';

import { signIn } from '@/lib/auth/config';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const callbackUrl = (formData.get('callbackUrl') as string) || '/dashboard';

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: callbackUrl,
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
    // This is needed for the redirect to work
    throw error;
  }
}
