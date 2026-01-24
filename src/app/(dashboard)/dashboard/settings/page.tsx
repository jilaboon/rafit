'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Building2,
  Bell,
  CreditCard,
  Shield,
  Palette,
  Globe,
  Clock,
  Mail,
  Phone,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'business' | 'notifications' | 'payments' | 'security' | 'branding';

interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  locale: string;
  hasStripeConnection: boolean;
  address: string | null;
  notifications: {
    emailReminder: boolean;
    smsReminder: boolean;
    reminderHoursBefore: number;
    bookingConfirmation: boolean;
    cancellationConfirmation: boolean;
  };
  payments: {
    vatRate: number;
    cancellationPolicyHours: number;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
  };
}

const tabs = [
  { id: 'business' as const, label: 'פרטי עסק', icon: Building2 },
  { id: 'notifications' as const, label: 'התראות', icon: Bell },
  { id: 'payments' as const, label: 'תשלומים', icon: CreditCard },
  { id: 'security' as const, label: 'אבטחה', icon: Shield },
  { id: 'branding' as const, label: 'מיתוג', icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notifications: {
      emailReminder: true,
      smsReminder: false,
      reminderHoursBefore: 2,
      bookingConfirmation: true,
      cancellationConfirmation: true,
    },
    payments: {
      vatRate: 17,
      cancellationPolicyHours: 4,
    },
    branding: {
      primaryColor: '#1e40af',
      secondaryColor: '#f97316',
    },
  });

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/tenants/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data.settings);
      setFormData({
        name: data.settings.name || '',
        email: data.settings.email || '',
        phone: data.settings.phone || '',
        address: data.settings.address || '',
        notifications: data.settings.notifications,
        payments: data.settings.payments,
        branding: data.settings.branding,
      });
    } catch (err) {
      setError('שגיאה בטעינת ההגדרות');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/tenants/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSettings(data.settings);
      setSuccess('ההגדרות נשמרו בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת ההגדרות');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormField = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNotification = (field: string, value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const updatePayment = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      payments: { ...prev.payments, [field]: value },
    }));
  };

  const updateBranding = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      branding: { ...prev.branding, [field]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">הגדרות</h1>
        <p className="text-muted-foreground">נהל את הגדרות העסק שלך</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tabs */}
        <Card className="h-fit lg:w-64">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'business' && (
            <Card>
              <CardHeader>
                <CardTitle>פרטי עסק</CardTitle>
                <CardDescription>מידע בסיסי על העסק שלך</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">שם העסק</Label>
                    <Input
                      id="businessName"
                      value={formData.name}
                      onChange={(e) => updateFormField('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">מזהה URL</Label>
                    <div className="flex">
                      <span className="flex items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                        rafit.co.il/
                      </span>
                      <Input
                        id="slug"
                        value={settings?.slug || ''}
                        disabled
                        className="rounded-r-none ltr-text"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormField('email', e.target.value)}
                        className="pr-9 ltr-text"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">טלפון</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormField('phone', e.target.value)}
                        className="pr-9 ltr-text"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">אזור זמן</Label>
                    <div className="relative">
                      <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="timezone"
                        value={settings?.timezone || 'Asia/Jerusalem'}
                        disabled
                        className="pr-9 ltr-text"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locale">שפה</Label>
                    <div className="relative">
                      <Globe className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="locale"
                        value={settings?.locale === 'he' ? 'עברית' : settings?.locale || 'עברית'}
                        disabled
                        className="pr-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">כתובת</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormField('address', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>הגדרות התראות</CardTitle>
                <CardDescription>נהל את ההתראות שנשלחות ללקוחות</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">תזכורות לפני שיעור</h4>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">תזכורת באימייל</p>
                      <p className="text-sm text-muted-foreground">
                        שלח תזכורת {formData.notifications.reminderHoursBefore} שעות לפני השיעור
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.emailReminder}
                      onCheckedChange={(checked) => updateNotification('emailReminder', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">תזכורת ב-SMS</p>
                      <p className="text-sm text-muted-foreground">
                        שלח SMS {formData.notifications.reminderHoursBefore} שעות לפני השיעור
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.smsReminder}
                      onCheckedChange={(checked) => updateNotification('smsReminder', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>שעות לפני השיעור</Label>
                    <Input
                      type="number"
                      min={1}
                      max={48}
                      value={formData.notifications.reminderHoursBefore}
                      onChange={(e) => updateNotification('reminderHoursBefore', parseInt(e.target.value) || 2)}
                      className="w-24 ltr-text"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">אישורים</h4>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">אישור הזמנה</p>
                      <p className="text-sm text-muted-foreground">
                        שלח אישור מיידי לאחר הזמנה
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.bookingConfirmation}
                      onCheckedChange={(checked) => updateNotification('bookingConfirmation', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">אישור ביטול</p>
                      <p className="text-sm text-muted-foreground">
                        שלח אישור לאחר ביטול הזמנה
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.cancellationConfirmation}
                      onCheckedChange={(checked) => updateNotification('cancellationConfirmation', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card>
              <CardHeader>
                <CardTitle>הגדרות תשלומים</CardTitle>
                <CardDescription>נהל את הגדרות התשלומים והחיובים</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Stripe</p>
                        <p className="text-sm text-muted-foreground">
                          {settings?.hasStripeConnection ? 'מחובר' : 'לא מחובר'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      הגדרות
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>מטבע ברירת מחדל</Label>
                    <Input
                      value={settings?.currency === 'ILS' ? '₪ (ILS)' : settings?.currency || '₪ (ILS)'}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>מע&quot;מ (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.payments.vatRate}
                      onChange={(e) => updatePayment('vatRate', parseFloat(e.target.value) || 0)}
                      className="ltr-text"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>מדיניות ביטול</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={168}
                      value={formData.payments.cancellationPolicyHours}
                      onChange={(e) => updatePayment('cancellationPolicyHours', parseInt(e.target.value) || 0)}
                      className="w-20 ltr-text"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      שעות לפני השיעור
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    לקוחות יוכלו לבטל עד {formData.payments.cancellationPolicyHours} שעות לפני השיעור ללא חיוב
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>אבטחה ופרטיות</CardTitle>
                <CardDescription>הגדרות אבטחה וגישה</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">אימות דו-שלבי (MFA)</h4>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">הפעל אימות דו-שלבי</p>
                      <p className="text-sm text-muted-foreground">
                        דרוש קוד נוסף בכניסה לחשבון
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      הגדר
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">סיסמה</h4>
                  <Button variant="outline">שנה סיסמה</Button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">מכשירים מחוברים</h4>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">המכשיר הנוכחי</p>
                        <p className="text-sm text-muted-foreground">
                          Chrome • macOS • תל אביב
                        </p>
                      </div>
                      <span className="text-sm text-success">פעיל עכשיו</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'branding' && (
            <Card>
              <CardHeader>
                <CardTitle>מיתוג</CardTitle>
                <CardDescription>התאם את המראה של הפורטל שלך</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>לוגו</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed">
                      {settings?.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">
                          {settings?.name?.[0] || 'R'}
                        </span>
                      )}
                    </div>
                    <Button variant="outline">העלה לוגו</Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>צבע ראשי</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.branding.primaryColor}
                        onChange={(e) => updateBranding('primaryColor', e.target.value)}
                        className="h-10 w-14 p-1"
                      />
                      <Input
                        value={formData.branding.primaryColor}
                        onChange={(e) => updateBranding('primaryColor', e.target.value)}
                        className="ltr-text"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>צבע משני</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.branding.secondaryColor}
                        onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                        className="h-10 w-14 p-1"
                      />
                      <Input
                        value={formData.branding.secondaryColor}
                        onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                        className="ltr-text"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={isSaving}>
              שמור שינויים
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
