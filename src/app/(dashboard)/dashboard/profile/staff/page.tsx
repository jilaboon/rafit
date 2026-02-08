'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Briefcase,
  FileText,
  Award,
  Palette,
  DollarSign,
  Eye,
  ArrowRight,
  Plus,
  X,
} from 'lucide-react';

interface StaffProfile {
  id: string;
  title: string | null;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  hourlyRate: number | null;
  color: string | null;
  isPublic: boolean;
  branch: {
    id: string;
    name: string;
  } | null;
}

export default function StaffProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    specialties: [] as string[],
    certifications: [] as string[],
    hourlyRate: '',
    color: '#3b82f6',
    isPublic: true,
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const { data: profile, isLoading, error: queryError } = useQuery<StaffProfile | null>({
    queryKey: ['staff-profile'],
    queryFn: async () => {
      const response = await fetch('/api/users/me/staff-profile');
      const data = await response.json();

      if (response.ok) {
        if (data.staffProfile) {
          setFormData({
            title: data.staffProfile.title || '',
            bio: data.staffProfile.bio || '',
            specialties: data.staffProfile.specialties || [],
            certifications: data.staffProfile.certifications || [],
            hourlyRate: data.staffProfile.hourlyRate?.toString() || '',
            color: data.staffProfile.color || '#3b82f6',
            isPublic: data.staffProfile.isPublic ?? true,
          });
          setNoProfile(false);
          return data.staffProfile;
        } else {
          setNoProfile(true);
          return null;
        }
      } else {
        if (response.status === 403) {
          throw new Error('רק מדריכים ומנהלים יכולים ליצור פרופיל מדריך');
        }
        throw new Error(data.error || 'Failed to load profile');
      }
    },
    retry: false,
  });

  const fetchError = queryError?.message || error;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/users/me/staff-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || null,
          bio: formData.bio || null,
          specialties: formData.specialties,
          certifications: formData.certifications,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          color: formData.color,
          isPublic: formData.isPublic,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-profile'] });
      setNoProfile(false);
      setSuccess(data.message);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || 'An error occurred');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    saveMutation.mutate();
  };

  const isSaving = saveMutation.isPending;

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty.trim()],
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((s) => s !== specialty),
    });
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()],
      });
      setNewCertification('');
    }
  };

  const removeCertification = (certification: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((c) => c !== certification),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (fetchError && !noProfile && !profile) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="sm">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה לפרופיל
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{fetchError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="sm">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">פרופיל מדריך</h1>
          <p className="text-muted-foreground mt-1">
            {noProfile ? 'צור את הפרופיל המקצועי שלך' : 'עדכן את הפרטים המקצועיים שלך'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              פרטים בסיסיים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">תואר / תפקיד</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="מדריך יוגה בכיר"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                אודות
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="ספר/י על עצמך, הניסיון שלך והגישה שלך לאימונים..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/1000 תווים
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Specialties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              התמחויות
            </CardTitle>
            <CardDescription>הוסף את תחומי ההתמחות שלך</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="יוגה, פילאטיס, HIIT..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecialty();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSpecialty}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="gap-1">
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(specialty)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              הסמכות ותעודות
            </CardTitle>
            <CardDescription>הוסף את ההסמכות והתעודות שלך</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="מדריך כושר מוסמך, RYT-200..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCertification();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCertification}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert) => (
                  <Badge key={cert} variant="outline" className="gap-1">
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              הגדרות תצוגה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="hourlyRate" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                תעריף לשעה (₪)
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="150"
                className="w-40"
                dir="ltr"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">צבע בלוח הזמנים</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="w-28"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  פרופיל ציבורי
                </Label>
                <p className="text-sm text-muted-foreground">
                  הפרופיל שלך יוצג ללקוחות באתר
                </p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-100 text-green-700 text-sm">{success}</div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'שומר...' : noProfile ? 'צור פרופיל' : 'שמור שינויים'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
        </div>
      </form>
    </div>
  );
}
