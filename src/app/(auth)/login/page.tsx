'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Eye, EyeOff, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'שגיאה בהתחברות',
          description: 'אימייל או סיסמה שגויים',
        });
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'אירעה שגיאה בהתחברות. נסה שוב.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    const email = getValues('email');
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'נא להזין כתובת אימייל',
      });
      return;
    }

    setIsMagicLinkLoading(true);
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: 'נשלח בהצלחה',
          description: 'קישור התחברות נשלח לאימייל שלך',
        });
      } else {
        const data = await response.json();
        toast({
          variant: 'destructive',
          title: 'שגיאה',
          description: data.error || 'אירעה שגיאה בשליחת הקישור',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'אירעה שגיאה בשליחת הקישור',
      });
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">התחברות</CardTitle>
        <CardDescription>התחבר לחשבון <span className="brand-name">RAFIT</span> שלך</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="ltr-text"
              autoComplete="email"
              error={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">סיסמה</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                שכחת סיסמה?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="הזן סיסמה"
                autoComplete="current-password"
                error={!!errors.password}
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            התחבר
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">או</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleMagicLink}
          loading={isMagicLinkLoading}
        >
          <Mail className="ml-2 h-4 w-4" />
          שלח לי קישור התחברות
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          אין לך חשבון?{' '}
          <Link href="/register" className="text-primary hover:underline">
            הרשם עכשיו
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
