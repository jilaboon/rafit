'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  MoreHorizontal,
  Clock,
  Users,
  CreditCard,
  Dumbbell,
  User,
  Calendar,
  Star,
  Loader2,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description?: string;
  type: string;
  duration: number;
  defaultCapacity: number;
  color?: string;
  price?: number;
  creditCost: number;
  isActive: boolean;
  classCount: number;
}

const typeLabels: Record<string, { label: string; icon: typeof Dumbbell }> = {
  GROUP_CLASS: { label: 'שיעור קבוצתי', icon: Users },
  PERSONAL: { label: 'אימון אישי', icon: User },
  WORKSHOP: { label: 'סדנה', icon: Star },
  COURSE: { label: 'קורס', icon: Calendar },
};

const defaultColors = [
  '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981',
  '#3b82f6', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteService, setDeleteService] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingService, setTogglingService] = useState<string | null>(null);

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    type: 'GROUP_CLASS',
    duration: 60,
    defaultCapacity: 20,
    price: 0,
    creditCost: 1,
    color: defaultColors[0],
  });

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/services?includeInactive=true');
      const data = await response.json();
      if (data.services) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCreateService = async () => {
    if (!newService.name) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService),
      });

      const data = await response.json();

      if (data.success) {
        setShowNewDialog(false);
        setNewService({
          name: '',
          description: '',
          type: 'GROUP_CLASS',
          duration: 60,
          defaultCapacity: 20,
          price: 0,
          creditCost: 1,
          color: defaultColors[Math.floor(Math.random() * defaultColors.length)],
        });
        fetchServices();
      } else {
        alert(data.error || 'שגיאה ביצירת שירות');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      alert('שגיאה ביצירת שירות');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    setTogglingService(service.id);
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, isActive: !s.isActive } : s
          )
        );
      } else {
        alert(data.error || 'שגיאה בעדכון שירות');
      }
    } catch (error) {
      console.error('Error toggling service:', error);
      alert('שגיאה בעדכון שירות');
    } finally {
      setTogglingService(null);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteService) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/services/${deleteService.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDeleteService(null);
        fetchServices();
      } else {
        alert(data.error || 'שגיאה במחיקת שירות');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('שגיאה במחיקת שירות');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeServices = services.filter((s) => s.isActive);
  const inactiveServices = services.filter((s) => !s.isActive);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">שירותים</h1>
          <p className="text-muted-foreground">ניהול סוגי שיעורים ואימונים</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="ml-2 h-4 w-4" />
          שירות חדש
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{services.length}</p>
              <p className="text-sm text-muted-foreground">סה&quot;כ שירותים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-success/10 p-2">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {services.filter((s) => s.type === 'GROUP_CLASS').length}
              </p>
              <p className="text-sm text-muted-foreground">שיעורים קבוצתיים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-secondary/10 p-2">
              <User className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {services.filter((s) => s.type === 'PERSONAL').length}
              </p>
              <p className="text-sm text-muted-foreground">אימונים אישיים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-warning/10 p-2">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {services.reduce((sum, s) => sum + s.classCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">תבניות שיעור</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">שירותים פעילים</CardTitle>
        </CardHeader>
        <CardContent>
          {activeServices.length === 0 ? (
            <div className="py-12 text-center">
              <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">אין שירותים פעילים</p>
              <p className="text-sm text-muted-foreground">צור שירות חדש להתחיל</p>
              <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                <Plus className="ml-2 h-4 w-4" />
                שירות חדש
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeServices.map((service) => {
                const TypeIcon = typeLabels[service.type]?.icon || Dumbbell;
                return (
                  <Card key={service.id} className="overflow-hidden">
                    <div className="flex">
                      <div
                        className="w-2"
                        style={{ backgroundColor: service.color || '#8b5cf6' }}
                      />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {service.description || 'ללא תיאור'}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/services/${service.id}`}>
                                  עריכה
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(service)}
                                disabled={togglingService === service.id}
                              >
                                {togglingService === service.id ? (
                                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                ) : null}
                                השבתה
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteService(service)}
                              >
                                <Trash2 className="ml-2 h-4 w-4" />
                                מחיקה
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TypeIcon className="h-4 w-4" />
                            {typeLabels[service.type]?.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {service.duration} דקות
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            עד {service.defaultCapacity}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                          <div className="flex items-center gap-1 text-lg font-semibold">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {service.price ? formatCurrency(service.price) : 'ללא מחיר'}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {service.creditCost} קרדיט
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Services */}
      {inactiveServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              שירותים לא פעילים ({inactiveServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: service.color || '#8b5cf6' }}
                    />
                    <span>{service.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(service)}
                    disabled={togglingService === service.id}
                  >
                    {togglingService === service.id ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : null}
                    הפעל
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Service Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>שירות חדש</DialogTitle>
            <DialogDescription>הוסף סוג שיעור או אימון חדש</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם השירות *</Label>
              <Input
                id="name"
                value={newService.name}
                onChange={(e) =>
                  setNewService((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="לדוגמה: יוגה, פילאטיס, HIIT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">תיאור</Label>
              <Input
                id="description"
                value={newService.description}
                onChange={(e) =>
                  setNewService((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>סוג</Label>
                <Select
                  value={newService.type}
                  onValueChange={(value) =>
                    setNewService((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">משך (דקות)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newService.duration}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value) || 60,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">קיבולת ברירת מחדל</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newService.defaultCapacity}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      defaultCapacity: parseInt(e.target.value) || 20,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">מחיר (₪)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>צבע</Label>
              <div className="flex gap-2">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${
                      newService.color === color
                        ? 'border-foreground'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewService((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateService} disabled={isCreating}>
              {isCreating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              צור שירות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת שירות</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את {deleteService?.name}?
              <br />
              פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteService(null)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDeleteService} disabled={isDeleting}>
              {isDeleting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
