'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// Mock data
const mockPlans = [
  {
    id: '1',
    name: 'מנוי חודשי',
    type: 'SUBSCRIPTION',
    price: 350,
    activeCount: 45,
  },
  {
    id: '2',
    name: 'כרטיסייה 10',
    type: 'PUNCH_CARD',
    price: 500,
    activeCount: 23,
  },
  {
    id: '3',
    name: 'ניסיון חינם',
    type: 'TRIAL',
    price: 0,
    activeCount: 8,
  },
];

const mockMemberships = [
  {
    id: '1',
    customerName: 'רחל דוידוביץ',
    customerId: '1',
    planName: 'מנוי חודשי',
    planType: 'SUBSCRIPTION',
    status: 'ACTIVE',
    startDate: new Date(2023, 11, 1),
    endDate: new Date(2024, 11, 1),
    sessionsRemaining: null,
    nextBillingDate: new Date(2024, 1, 1),
    price: 350,
  },
  {
    id: '2',
    customerName: 'אורי כהן',
    customerId: '2',
    planName: 'כרטיסייה 10',
    planType: 'PUNCH_CARD',
    status: 'ACTIVE',
    startDate: new Date(2023, 10, 15),
    endDate: new Date(2024, 1, 15),
    sessionsRemaining: 6,
    nextBillingDate: null,
    price: 500,
  },
  {
    id: '3',
    customerName: 'יעל אברהם',
    customerId: '3',
    planName: 'ניסיון חינם',
    planType: 'TRIAL',
    status: 'ACTIVE',
    startDate: new Date(2024, 0, 10),
    endDate: new Date(2024, 0, 24),
    sessionsRemaining: 1,
    nextBillingDate: null,
    price: 0,
  },
  {
    id: '4',
    customerName: 'שרה מזרחי',
    customerId: '5',
    planName: 'מנוי חודשי',
    planType: 'SUBSCRIPTION',
    status: 'EXPIRED',
    startDate: new Date(2023, 5, 1),
    endDate: new Date(2023, 11, 1),
    sessionsRemaining: null,
    nextBillingDate: null,
    price: 350,
  },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredMemberships = mockMemberships.filter((m) => {
    const matchesSearch = m.customerName.includes(searchQuery);
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: mockMemberships
      .filter((m) => m.status === 'ACTIVE')
      .reduce((sum, m) => sum + m.price, 0),
    activeMembers: mockMemberships.filter((m) => m.status === 'ACTIVE').length,
    expiringThisMonth: mockMemberships.filter((m) => {
      if (!m.endDate) return false;
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return m.endDate <= endOfMonth && m.status === 'ACTIVE';
    }).length,
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
              <p className="text-2xl font-bold">{stats.activeMembers}</p>
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
              <p className="text-2xl font-bold">{stats.expiringThisMonth}</p>
              <p className="text-sm text-muted-foreground">פג תוקף החודש</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-secondary/10 p-2">
              <RefreshCw className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockMemberships.filter((m) => m.planType === 'SUBSCRIPTION' && m.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-muted-foreground">מנויים מתחדשים</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {mockPlans.map((plan) => (
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
          <div className="space-y-4">
            {filteredMemberships.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">לא נמצאו מנויים</p>
              </div>
            ) : (
              filteredMemberships.map((membership) => (
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
                          {formatDate(membership.startDate)} - {formatDate(membership.endDate)}
                        </span>
                        {membership.sessionsRemaining !== null && (
                          <span>נותרו {membership.sessionsRemaining} כניסות</span>
                        )}
                        {membership.nextBillingDate && (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            חיוב הבא: {formatDate(membership.nextBillingDate)}
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
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
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
                        {membership.status === 'ACTIVE' && (
                          <>
                            <DropdownMenuItem>
                              <Pause className="ml-2 h-4 w-4" />
                              השהיה
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              ביטול
                            </DropdownMenuItem>
                          </>
                        )}
                        {membership.status === 'PAUSED' && (
                          <DropdownMenuItem>
                            <RefreshCw className="ml-2 h-4 w-4" />
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
        </CardContent>
      </Card>
    </div>
  );
}
