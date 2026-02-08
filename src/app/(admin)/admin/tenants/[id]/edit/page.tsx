'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface TenantData {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  currency: string;
  locale: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
}

const timezones = [
  { value: 'Asia/Jerusalem', label: 'ישראל (IST)' },
  { value: 'Europe/London', label: 'לונדון (GMT/BST)' },
  { value: 'America/New_York', label: 'ניו יורק (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'לוס אנג׳לס (PST/PDT)' },
  { value: 'Europe/Paris', label: 'פריז (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'טוקיו (JST)' },
];

const currencies = [
  { value: 'ILS', label: '₪ שקל ישראלי' },
  { value: 'USD', label: '$ דולר אמריקאי' },
  { value: 'EUR', label: '€ אירו' },
  { value: 'GBP', label: '£ לירה שטרלינג' },
];

const locales = [
  { value: 'he', label: 'עברית' },
  { value: 'en', label: 'אנגלית' },
  { value: 'ar', label: 'ערבית' },
];

const statuses = [
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'SUSPENDED', label: 'מושהה' },
  { value: 'CANCELLED', label: 'מבוטל' },
];

export default function TenantEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: tenantId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TenantData | null>(null);

  const { isLoading, error: queryError } = useQuery<TenantData>({
    queryKey: ['admin-tenant', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${tenantId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה בטעינת פרטי העסק');
      const tenant: TenantData = {
        id: data.tenant.id,
        name: data.tenant.name,
        slug: data.tenant.slug,
        email: data.tenant.email,
        phone: data.tenant.phone,
        timezone: data.tenant.timezone,
        currency: data.tenant.currency,
        locale: data.tenant.locale,
        status: data.tenant.status,
      };
      setFormData(tenant);
      return tenant;
    },
    enabled: !!tenantId,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData || !tenantId) throw new Error('Missing data');
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          timezone: formData.timezone,
          currency: formData.currency,
          locale: formData.locale,
          status: formData.status,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה בעדכון העסק');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      router.push(`/admin/tenants/${tenantId}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'אירעה שגיאה');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !tenantId) return;
    setError(null);
    saveMutation.mutate();
  };

  const isSaving = saveMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayError = error || queryError?.message || null;

  if (displayError && !formData) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Link href="/admin/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">שגיאה</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{displayError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Link href={`/admin/tenants/${tenantId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">עריכת עסק</h1>
          <p className="text-muted-foreground mt-1">{formData.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי העסק</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">שם העסק</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">מזהה (לקריאה בלבד)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  className="text-muted-foreground"
                  disabled
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">אימייל ליצירת קשר</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value || null })
                  }
                  placeholder="contact@business.com"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value || null })
                  }
                  placeholder="050-XXX-XXXX"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">אזור זמן</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר אזור זמן" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">מטבע</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מטבע" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locale">שפה</Label>
                <Select
                  value={formData.locale}
                  onValueChange={(value) =>
                    setFormData({ ...formData, locale: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר שפה" />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((locale) => (
                      <SelectItem key={locale.value} value={locale.value}>
                        {locale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">סטטוס</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  'שמירת שינויים'
                )}
              </Button>
              <Link href={`/admin/tenants/${tenantId}`}>
                <Button
                  type="button"
                  variant="outline"
                >
                  ביטול
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
