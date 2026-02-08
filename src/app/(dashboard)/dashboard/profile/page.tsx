'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Shield, Building2, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { UserRole } from '@prisma/client';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  tenantInfo: {
    role: UserRole;
    isActive: boolean;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
    hasStaffProfile: boolean;
    staffProfileId: string | null;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const { data: profile, isLoading, error: queryError } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/users/me');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load profile');
      setFormData({
        name: data.user.name || '',
        phone: data.user.phone || '',
      });
      return data.user;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSuccess(data.message);
      setError(null);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    },
    onError: (err: Error) => {
      setError(err.message || 'An error occurred');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    updateMutation.mutate();
  };

  const isSaving = updateMutation.isPending;

  const hasChanges =
    profile && (formData.name !== profile.name || formData.phone !== (profile.phone || ''));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{queryError?.message || error || 'Failed to load profile'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">הפרופיל שלי</h1>
        <p className="text-muted-foreground mt-1">ניהול פרטי החשבון שלך</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {profile.tenantInfo && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {ROLE_LABELS[profile.tenantInfo.role]}
                  </Badge>
                )}
                {profile.emailVerifiedAt ? (
                  <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    אימייל מאומת
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-700">
                    <AlertCircle className="h-3 w-3" />
                    אימייל לא מאומת
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            פרטים אישיים
          </CardTitle>
          <CardDescription>עדכן את הפרטים האישיים שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                אימייל
              </Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">לא ניתן לשנות את כתובת האימייל</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                שם מלא
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="הכנס שם מלא"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                טלפון
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="050-000-0000"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-100 text-green-700 text-sm">{success}</div>
            )}

            <Button type="submit" disabled={isSaving || !hasChanges}>
              {isSaving ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tenant Info */}
      {profile.tenantInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              פרטי הארגון
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ארגון</p>
                <p className="font-medium">{profile.tenantInfo.tenant.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">תפקיד</p>
                <Badge variant="outline">{ROLE_LABELS[profile.tenantInfo.role]}</Badge>
              </div>
            </div>

            {profile.tenantInfo.hasStaffProfile && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">פרופיל מדריך</p>
                    <p className="text-sm text-muted-foreground">
                      יש לך פרופיל מדריך - ניתן לערוך פרטים נוספים
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/profile/staff')}
                  >
                    ערוך פרופיל מדריך
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            פרטי חשבון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">נוצר בתאריך</p>
              <p>{new Date(profile.createdAt).toLocaleDateString('he-IL')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">עודכן לאחרונה</p>
              <p>{new Date(profile.updatedAt).toLocaleDateString('he-IL')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">סטטוס</p>
              <Badge variant={profile.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {profile.status === 'ACTIVE' ? 'פעיל' : profile.status}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">אימות דו-שלבי</p>
              <Badge variant={profile.mfaEnabled ? 'default' : 'secondary'}>
                {profile.mfaEnabled ? 'מופעל' : 'לא מופעל'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
