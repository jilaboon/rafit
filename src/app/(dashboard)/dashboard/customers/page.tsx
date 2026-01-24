'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Mail,
  Phone,
  Tag,
  Filter,
  Download,
  Users,
  UserPlus,
  TrendingUp,
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';

// Mock data - will be replaced with real API data
const mockCustomers = [
  {
    id: '1',
    firstName: 'רחל',
    lastName: 'דוידוביץ',
    email: 'rachel@example.com',
    phone: '050-1234567',
    tags: ['VIP', 'יוגה'],
    membershipStatus: 'active',
    lastVisit: new Date(2024, 0, 14),
    totalVisits: 45,
  },
  {
    id: '2',
    firstName: 'אורי',
    lastName: 'כהן',
    email: 'ori@example.com',
    phone: '050-2345678',
    tags: ['פילאטיס'],
    membershipStatus: 'active',
    lastVisit: new Date(2024, 0, 13),
    totalVisits: 28,
  },
  {
    id: '3',
    firstName: 'יעל',
    lastName: 'אברהם',
    email: 'yael@example.com',
    phone: '050-3456789',
    tags: [],
    membershipStatus: 'trial',
    lastVisit: new Date(2024, 0, 10),
    totalVisits: 2,
  },
  {
    id: '4',
    firstName: 'דני',
    lastName: 'לוי',
    email: 'dani@example.com',
    phone: '050-4567890',
    tags: [],
    membershipStatus: 'lead',
    lastVisit: null,
    totalVisits: 0,
  },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'פעיל', color: 'bg-success/10 text-success' },
  trial: { label: 'ניסיון', color: 'bg-warning/10 text-warning' },
  expired: { label: 'פג תוקף', color: 'bg-destructive/10 text-destructive' },
  lead: { label: 'ליד', color: 'bg-primary/10 text-primary' },
};

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.firstName.includes(searchQuery) ||
      c.lastName.includes(searchQuery) ||
      c.email.includes(searchQuery) ||
      c.phone.includes(searchQuery)
  );

  const stats = {
    total: mockCustomers.length,
    active: mockCustomers.filter((c) => c.membershipStatus === 'active').length,
    trial: mockCustomers.filter((c) => c.membershipStatus === 'trial').length,
    leads: mockCustomers.filter((c) => c.membershipStatus === 'lead').length,
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
          <Link href="/dashboard/customers/new">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              לקוח חדש
            </Button>
          </Link>
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
          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">לא נמצאו לקוחות</p>
                <p className="text-sm text-muted-foreground">
                  נסה לחפש במונחים אחרים
                </p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
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
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
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
