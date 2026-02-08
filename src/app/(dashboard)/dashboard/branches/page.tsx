'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  DoorOpen,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  isActive: boolean;
  roomsCount: number;
  staffCount: number;
  upcomingClassesCount: number;
  createdAt: string;
}

interface BranchFormData {
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const initialFormData: BranchFormData = {
  name: '',
  slug: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  isActive: true,
};

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(initialFormData);

  const { data, isLoading } = useQuery<{ branches: Branch[] }>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches?includeInactive=true');
      if (!response.ok) throw new Error('Failed to fetch branches');
      return response.json();
    },
  });

  const branches = data?.branches ?? [];

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[\u0590-\u05FF]/g, '') // Remove Hebrew
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (branchData: BranchFormData) => {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create branch');
      return data;
    },
    onSuccess: () => {
      setSuccess('הסניף נוצר בהצלחה');
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message || 'שגיאה ביצירת הסניף');
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ branchId, branchData }: { branchId: string; branchData: Partial<BranchFormData> }) => {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update branch');
      return data;
    },
    onSuccess: () => {
      setSuccess('הסניף עודכן בהצלחה');
      setIsEditDialogOpen(false);
      setSelectedBranch(null);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message || 'שגיאה בעדכון הסניף');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (branchId: string) => {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete branch');
      return data;
    },
    onSuccess: () => {
      setSuccess('הסניף נמחק בהצלחה');
      setIsDeleteDialogOpen(false);
      setSelectedBranch(null);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message || 'שגיאה במחיקת הסניף');
    },
  });

  const isSaving = createMutation.isPending || editMutation.isPending || deleteMutation.isPending;

  const handleCreate = () => {
    setError(null);
    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedBranch) return;
    setError(null);
    editMutation.mutate({
      branchId: selectedBranch.id,
      branchData: {
        name: formData.name,
        address: formData.address || null as unknown as string,
        city: formData.city || null as unknown as string,
        phone: formData.phone || null as unknown as string,
        email: formData.email || null as unknown as string,
        isActive: formData.isActive,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedBranch) return;
    setError(null);
    deleteMutation.mutate(selectedBranch.id);
  };

  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      slug: branch.slug,
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      email: branch.email || '',
      isActive: branch.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDeleteDialogOpen(true);
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">סניפים</h1>
          <p className="text-muted-foreground">נהל את הסניפים של העסק</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          סניף חדש
        </Button>
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

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">אין סניפים</h3>
            <p className="text-muted-foreground">צור את הסניף הראשון שלך</p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              סניף חדש
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className={cn(!branch.isActive && 'opacity-60')}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'rounded-lg p-2',
                    branch.isActive ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <Building2 className={cn(
                      'h-5 w-5',
                      branch.isActive ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{branch.name}</CardTitle>
                    <CardDescription className="text-xs ltr-text">
                      /{branch.slug}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(branch)}>
                      <Pencil className="ml-2 h-4 w-4" />
                      ערוך
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDeleteDialog(branch)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      מחק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                {(branch.address || branch.city) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{[branch.address, branch.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="ltr-text">{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="ltr-text">{branch.email}</span>
                  </div>
                )}

                <div className="flex gap-4 pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-sm">
                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{branch.roomsCount}</span>
                    <span className="text-muted-foreground">חדרים</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{branch.staffCount}</span>
                    <span className="text-muted-foreground">צוות</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{branch.upcomingClassesCount}</span>
                    <span className="text-muted-foreground">שיעורים</span>
                  </div>
                </div>

                {!branch.isActive && (
                  <div className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    לא פעיל
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>סניף חדש</DialogTitle>
            <DialogDescription>הוסף סניף חדש לעסק</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">שם הסניף *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="סניף תל אביב"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">מזהה URL *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="tel-aviv"
                  className="ltr-text"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">עיר</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="תל אביב"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="03-1234567"
                  className="ltr-text"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">כתובת</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="רחוב הרצל 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="branch@example.com"
                className="ltr-text"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>סניף פעיל</Label>
                <p className="text-sm text-muted-foreground">סניף פעיל יופיע בלוח הזמנים</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreate} loading={isSaving} disabled={!formData.name || !formData.slug}>
              צור סניף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת סניף</DialogTitle>
            <DialogDescription>עדכן את פרטי הסניף</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">שם הסניף *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-city">עיר</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">טלפון</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="ltr-text"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">כתובת</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">אימייל</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="ltr-text"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>סניף פעיל</Label>
                <p className="text-sm text-muted-foreground">סניף פעיל יופיע בלוח הזמנים</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleEdit} loading={isSaving} disabled={!formData.name}>
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת סניף</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הסניף &quot;{selectedBranch?.name}&quot;?
              <br />
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? 'מוחק...' : 'מחק סניף'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
