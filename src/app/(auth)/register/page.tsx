'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const password = watch('password', '');

  const passwordRequirements = [
    { label: 'לפחות 8 תווים', valid: password.length >= 8 },
    { label: 'אות קטנה באנגלית', valid: /[a-z]/.test(password) },
    { label: 'אות גדולה באנגלית', valid: /[A-Z]/.test(password) },
    { label: 'מספר', valid: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'נרשמת בהצלחה!',
          description: 'בדוק את האימייל שלך לאימות החשבון',
        });
        router.push('/login?registered=true');
      } else {
        toast({
          variant: 'destructive',
          title: 'שגיאה בהרשמה',
          description: result.error || 'אירעה שגיאה בהרשמה',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'אירעה שגיאה בהרשמה. נסה שוב.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">יצירת חשבון</CardTitle>
        <CardDescription>הצטרף ל-<span className="brand-name">RAFIT</span> והתחל לנהל את הסטודיו שלך</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" required>
              שם מלא
            </Label>
            <Input
              id="name"
              placeholder="ישראל ישראלי"
              autoComplete="name"
              error={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" required>
              אימייל
            </Label>
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
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="050-1234567"
              className="ltr-text"
              autoComplete="tel"
              error={!!errors.phone}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" required>
              סיסמה
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="צור סיסמה חזקה"
                autoComplete="new-password"
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
            {password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      req.valid ? 'text-success' : 'text-muted-foreground'
                    )}
                  >
                    {req.valid ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {req.label}
                  </div>
                ))}
              </div>
            )}
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" required>
              אימות סיסמה
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="הזן סיסמה שוב"
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="acceptTerms"
              className="mt-1 h-4 w-4 rounded border-input"
              {...register('acceptTerms')}
            />
            <Label htmlFor="acceptTerms" className="text-sm font-normal">
              אני מסכים ל
              <Link href="/terms" className="text-primary hover:underline mx-1">
                תנאי השימוש
              </Link>
              ול
              <Link href="/privacy" className="text-primary hover:underline mx-1">
                מדיניות הפרטיות
              </Link>
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
          )}

          <Button type="submit" className="w-full" loading={isLoading}>
            צור חשבון
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          כבר יש לך חשבון?{' '}
          <Link href="/login" className="text-primary hover:underline">
            התחבר
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
