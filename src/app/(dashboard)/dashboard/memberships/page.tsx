'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  CreditCard,
  Calendar,
  RefreshCw,
  Pause,
  TrendingUp,
  Users,
  AlertTriangle,
  Loader2,
  Play,
  X,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface MembershipPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  activeCount: number;
}

interface Membership {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  planType: string;
  status: string;
  startDate: string;
  endDate?: string;
  sessionsRemaining?: number;
  creditsRemaining?: number;
  autoRenew: boolean;
  price: number;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'פעיל', color: 'bg-success/10 text-success' },
  PAUSED: { label: 'מושהה', color: 'bg-warning/10 text-warning' },
  EXPIRED: { label: 'פג תוקף', color: 'bg-destructive/10 text-destructive' },
  CANCELLED: { label: 'בוטל', color: 'bg-muted text-muted-foreground' },
};

const typeLabels: Record<string, string> = {
  SUBSCRIPTION: 'מנוי',
  PUNCH_CARD: 'כרטיסייה',
  CREDITS: 'קרדיטים',
  TRIAL: 'ניסיון',
  DROP_IN: 'חד פעמי',
};

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    paused: 0,
    expired: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updatingMembership, setUpdatingMembership] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);

      const [membershipsRes, plansRes] = await Promise.all([
        fetch(`/api/memberships?${params}`),
        fetch('/api/membership-plans'),
      ]);

      const membershipsData = await membershipsRes.json();
      const plansData = await plansRes.json();

      if (membershipsData.memberships) {
        setMemberships(membershipsData.memberships);
        setStats(membershipsData.stats);
      }

      if (plansData.plans) {
        setPlans(plansData.plans);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (membershipId: string, newStatus: string) => {
    setUpdatingMembership(membershipId);
    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'שגיאה בעדכון מנוי');
      }
    } catch (error) {
      console.error('Error updating membership:', error);
      alert('שגיאה בעדכון מנוי');
    } finally {
      setUpdatingMembership(null);
    }
  };

  const handleCancelMembership = async (membershipId: string) => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את המנוי?')) return;

    setUpdatingMembership(membershipId);
    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'שגיאה בביטול מנוי');
      }
    } catch (error) {
      console.error('Error cancelling membership:', error);
      alert('שגיאה בביטול מנוי');
    } finally {
      setUpdatingMembership(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">חברויות</h1>
          <p className="text-muted-foreground">ניהול מנויים וחברויות</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/memberships/plans">
            <Button variant="outline">
              <CreditCard className="ml-2 h-4 w-4" />
              תוכניות
            </Button>
          </Link>
          <Link href="/dashboard/memberships/new">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              הקצאת מנוי
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-success/10 p-2">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">הכנסות חודשיות</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
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
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.paused}</p>
              <p className="text-sm text-muted-foreground">מושהים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-secondary/10 p-2">
              <RefreshCw className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {memberships.filter((m) => m.planType === 'SUBSCRIPTION' && m.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-muted-foreground">מנויים מתחדשים</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Summary */}
      {plans.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.slice(0, 3).map((plan) => (
            <Card key={plan.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {typeLabels[plan.type]} • {formatCurrency(plan.price)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">{plan.activeCount}</p>
                    <p className="text-xs text-muted-foreground">פעילים</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם לקוח..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex gap-2">
              {Object.entries(statusLabels).map(([key, { label }]) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memberships List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">רשימת מנויים</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {memberships.length === 0 ? (
                <div className="py-12 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">לא נמצאו מנויים</p>
                  <p className="text-sm text-muted-foreground">
                    {debouncedSearch || statusFilter
                      ? 'נסה לחפש במונחים אחרים'
                      : 'הקצה מנוי ללקוח הראשון'}
                  </p>
                </div>
              ) : (
                memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/customers/${membership.customerId}`}
                            className="font-medium hover:text-primary"
                          >
                            {membership.customerName}
                          </Link>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              statusLabels[membership.status]?.color
                            )}
                          >
                            {statusLabels[membership.status]?.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {membership.planName} • {typeLabels[membership.planType]}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(new Date(membership.startDate))}
                            {membership.endDate && ` - ${formatDate(new Date(membership.endDate))}`}
                          </span>
                          {membership.sessionsRemaining !== null &&
                            membership.sessionsRemaining !== undefined && (
                              <span>נותרו {membership.sessionsRemaining} כניסות</span>
                            )}
                          {membership.creditsRemaining !== null &&
                            membership.creditsRemaining !== undefined && (
                              <span>נותרו {membership.creditsRemaining} קרדיטים</span>
                            )}
                          {membership.autoRenew && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              מתחדש אוטומטית
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="font-semibold">{formatCurrency(membership.price)}</p>
                        <p className="text-xs text-muted-foreground">
                          {membership.planType === 'SUBSCRIPTION' ? 'לחודש' : 'סה"כ'}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={updatingMembership === membership.id}
                          >
                            {updatingMembership === membership.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/memberships/${membership.id}`}>
                              צפייה בפרטים
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/memberships/${membership.id}/edit`}>
                              עריכה
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {membership.status === 'ACTIVE' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(membership.id, 'PAUSED')}
                              >
                                <Pause className="ml-2 h-4 w-4" />
                                השהיה
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleCancelMembership(membership.id)}
                              >
                                <X className="ml-2 h-4 w-4" />
                                ביטול
                              </DropdownMenuItem>
                            </>
                          )}
                          {membership.status === 'PAUSED' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(membership.id, 'ACTIVE')}
                            >
                              <Play className="ml-2 h-4 w-4" />
                              הפעלה מחדש
                            </DropdownMenuItem>
                          )}
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
    </div>
  );
}
