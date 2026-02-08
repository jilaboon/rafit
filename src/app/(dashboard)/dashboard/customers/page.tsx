'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Tag,
  Filter,
  Download,
  Users,
  UserPlus,
  TrendingUp,
  Loader2,
  Trash2,
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags: string[];
  membershipStatus: string;
  activeMembership?: {
    planName: string;
    planType: string;
    sessionsRemaining?: number;
    creditsRemaining?: number;
  };
  totalVisits: number;
  lastVisit?: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'פעיל', color: 'bg-success/10 text-success' },
  trial: { label: 'ניסיון', color: 'bg-warning/10 text-warning' },
  expired: { label: 'פג תוקף', color: 'bg-destructive/10 text-destructive' },
  lead: { label: 'ליד', color: 'bg-primary/10 text-primary' },
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useQuery<{ customers: Customer[]; total: number }>({
    queryKey: ['customers', { search: debouncedSearch }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
  });

  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: async (customerData: typeof newCustomer) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'שגיאה ביצירת לקוח');
      return data;
    },
    onSuccess: () => {
      setShowNewDialog(false);
      setNewCustomer({ firstName: '', lastName: '', email: '', phone: '' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'שגיאה במחיקת לקוח');
      return data;
    },
    onSuccess: () => {
      setDeleteCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleCreateCustomer = () => {
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
      return;
    }
    createMutation.mutate(newCustomer);
  };

  const handleDeleteCustomer = () => {
    if (!deleteCustomer) return;
    deleteMutation.mutate(deleteCustomer.id);
  };

  const stats = {
    total,
    active: customers.filter((c) => c.membershipStatus === 'active').length,
    trial: customers.filter((c) => c.membershipStatus === 'trial').length,
    leads: customers.filter((c) => c.membershipStatus === 'lead').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">לקוחות</h1>
          <p className="text-muted-foreground">ניהול לקוחות ומתאמנים</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            ייצוא
          </Button>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="ml-2 h-4 w-4" />
            לקוח חדש
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">סה&quot;כ לקוחות</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-success/10 p-2">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">מנויים פעילים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-warning/10 p-2">
              <Users className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.trial}</p>
              <p className="text-sm text-muted-foreground">בניסיון</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.leads}</p>
              <p className="text-sm text-muted-foreground">לידים</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם, אימייל או טלפון..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="ml-2 h-4 w-4" />
                סינון
              </Button>
              <Button variant="outline">
                <Tag className="ml-2 h-4 w-4" />
                תגיות
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">רשימת לקוחות</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {customers.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">
                    {debouncedSearch ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {debouncedSearch ? 'נסה לחפש במונחים אחרים' : 'צור את הלקוח הראשון שלך'}
                  </p>
                  {!debouncedSearch && (
                    <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                      <Plus className="ml-2 h-4 w-4" />
                      לקוח חדש
                    </Button>
                  )}
                </div>
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {getInitials(`${customer.firstName} ${customer.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {customer.firstName} {customer.lastName}
                          </Link>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              statusLabels[customer.membershipStatus]?.color
                            )}
                          >
                            {statusLabels[customer.membershipStatus]?.label}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                        </div>
                        {customer.tags.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {customer.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-muted px-2 py-0.5 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-sm font-medium">{customer.totalVisits}</p>
                        <p className="text-xs text-muted-foreground">ביקורים</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/customers/${customer.id}`}>
                              צפייה בפרופיל
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/customers/${customer.id}/edit`}>
                              עריכה
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/bookings/new?customer=${customer.id}`}>
                              הזמנה חדשה
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/payments/new?customer=${customer.id}`}>
                              קבלת תשלום
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteCustomer(customer)}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            מחיקה
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Customer Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>לקוח חדש</DialogTitle>
            <DialogDescription>הוסף לקוח חדש למערכת</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">שם פרטי *</Label>
                <Input
                  id="firstName"
                  value={newCustomer.firstName}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">שם משפחה *</Label>
                <Input
                  id="lastName"
                  value={newCustomer.lastName}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל *</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateCustomer} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              צור לקוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת לקוח</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את {deleteCustomer?.firstName}{' '}
              {deleteCustomer?.lastName}?
              <br />
              פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCustomer(null)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
