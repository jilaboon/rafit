'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, Save, Monitor, Sun, Moon } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
}

const portalThemeOptions = [
  { value: 'system', label: 'מערכת', icon: Monitor },
  { value: 'light', label: 'בהיר', icon: Sun },
  { value: 'dark', label: 'כהה', icon: Moon },
] as const;

export default function PortalProfilePage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await fetch('/api/portal/me');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ profile: ProfileData }>;
    },
  });

  const [form, setForm] = useState({
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (data?.profile) {
      setForm({
        phone: data.profile.phone || '',
        address: data.profile.address || '',
        emergencyContact: data.profile.emergencyContact || '',
        emergencyPhone: data.profile.emergencyPhone || '',
      });
    }
  }, [data?.profile]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const res = await fetch('/api/portal/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: values.phone || null,
          address: values.address || null,
          emergencyContact: values.emergencyContact || null,
          emergencyPhone: values.emergencyPhone || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'שגיאה בעדכון');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-profile'] });
      setSuccessMsg('הפרופיל עודכן בהצלחה');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const profile = data?.profile;
  if (!profile) return null;

  return (
    <div className="p-4">
      <h2 className="mb-6 text-xl font-bold">פרופיל</h2>

      <div className="space-y-4">
        {/* Read-only fields */}
        <div>
          <Label className="text-muted-foreground">שם</Label>
          <Input
            value={`${profile.firstName} ${profile.lastName}`}
            disabled
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">לשינוי שם יש לפנות למועדון</p>
        </div>

        <div>
          <Label className="text-muted-foreground">אימייל</Label>
          <Input value={profile.email} disabled className="mt-1" />
          <p className="mt-1 text-xs text-muted-foreground">לשינוי אימייל יש לפנות למועדון</p>
        </div>

        {/* Editable fields */}
        <div>
          <Label htmlFor="phone">טלפון</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            className="mt-1"
            dir="ltr"
            placeholder="050-0000000"
          />
        </div>

        <div>
          <Label htmlFor="address">כתובת</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="emergencyContact">איש קשר לחירום</Label>
          <Input
            id="emergencyContact"
            value={form.emergencyContact}
            onChange={(e) => setForm((prev) => ({ ...prev, emergencyContact: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="emergencyPhone">טלפון חירום</Label>
          <Input
            id="emergencyPhone"
            value={form.emergencyPhone}
            onChange={(e) => setForm((prev) => ({ ...prev, emergencyPhone: e.target.value }))}
            className="mt-1"
            dir="ltr"
            placeholder="050-0000000"
          />
        </div>

        {successMsg && (
          <p className="text-sm font-medium text-green-600">{successMsg}</p>
        )}

        {mutation.error && (
          <p className="text-sm font-medium text-destructive">
            {mutation.error.message}
          </p>
        )}

        <Button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          שמירה
        </Button>
      </div>

      {/* Appearance */}
      <div className="mt-8 border-t pt-6">
        <Label className="text-muted-foreground mb-3 block">מראה</Label>
        <div className="flex gap-3">
          {portalThemeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setTheme(option.value);
                fetch('/api/users/me', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ themePreference: option.value }),
                }).catch(() => {});
              }}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors',
                theme === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/25'
              )}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="mt-8 border-t pt-6">
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={() => signOut({ callbackUrl: '/portal/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          התנתקות
        </Button>
      </div>
    </div>
  );
}
