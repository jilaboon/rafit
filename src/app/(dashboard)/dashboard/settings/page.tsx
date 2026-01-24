'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'business' | 'notifications' | 'payments' | 'security' | 'branding';

const tabs = [
  { id: 'business' as const, label: 'פרטי עסק', icon: Building2 },
  { id: 'notifications' as const, label: 'התראות', icon: Bell },
  { id: 'payments' as const, label: 'תשלומים', icon: CreditCard },
  { id: 'security' as const, label: 'אבטחה', icon: Shield },
  { id: 'branding' as const, label: 'מיתוג', icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">הגדרות</h1>
        <p className="text-muted-foreground">נהל את הגדרות העסק שלך</p>
      </div>

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
                    <Input id="businessName" defaultValue="סטודיו פלא" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">מזהה URL</Label>
                    <div className="flex">
                      <span className="flex items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                        rafit.co.il/
                      </span>
                      <Input
                        id="slug"
                        defaultValue="studio-pela"
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
                        defaultValue="info@studiopela.co.il"
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
                        defaultValue="03-1234567"
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
                        defaultValue="Asia/Jerusalem"
                        disabled
                        className="pr-9 ltr-text"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locale">שפה</Label>
                    <div className="relative">
                      <Globe className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="locale" defaultValue="עברית" disabled className="pr-9" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">כתובת</Label>
                  <Input id="address" defaultValue="רחוב דיזנגוף 99, תל אביב" />
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
                        שלח תזכורת שעתיים לפני השיעור
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">תזכורת ב-SMS</p>
                      <p className="text-sm text-muted-foreground">
                        שלח SMS שעתיים לפני השיעור
                      </p>
                    </div>
                    <input type="checkbox" className="h-5 w-5" />
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
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">אישור ביטול</p>
                      <p className="text-sm text-muted-foreground">
                        שלח אישור לאחר ביטול הזמנה
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
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
                        <p className="text-sm text-muted-foreground">מחובר</p>
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
                    <Input defaultValue="₪ (ILS)" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>מע&quot;מ</Label>
                    <Input defaultValue="17%" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>מדיניות ביטול</Label>
                  <div className="flex gap-2">
                    <Input type="number" defaultValue="4" className="w-20 ltr-text" />
                    <span className="flex items-center text-sm text-muted-foreground">
                      שעות לפני השיעור
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    לקוחות יוכלו לבטל עד X שעות לפני השיעור ללא חיוב
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
                      <span className="text-2xl font-bold text-muted-foreground">R</span>
                    </div>
                    <Button variant="outline">העלה לוגו</Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>צבע ראשי</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#1e40af" className="h-10 w-14 p-1" />
                      <Input defaultValue="#1e40af" className="ltr-text" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>צבע משני</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#f97316" className="h-10 w-14 p-1" />
                      <Input defaultValue="#f97316" className="ltr-text" />
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
