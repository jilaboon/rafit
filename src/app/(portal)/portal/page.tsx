'use client';

import { useQuery } from '@tanstack/react-query';
import { MembershipCard, type MembershipData } from '@/components/portal/membership-card';
import { EmptyState } from '@/components/portal/empty-state';
import { CalendarDays, CreditCard, BookOpen, ClipboardList, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

interface ProfileResponse {
  profile: {
    firstName: string;
    lastName: string;
  };
}

interface BookingItem {
  id: string;
  status: string;
  classInstance: {
    name: string;
    startTime: string;
    endTime: string;
  };
}

interface BookingsResponse {
  bookings: BookingItem[];
}

export default function PortalHomePage() {
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await fetch('/api/portal/me');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<ProfileResponse>;
    },
  });

  const { data: membData } = useQuery({
    queryKey: ['portal-memberships'],
    queryFn: async () => {
      const res = await fetch('/api/portal/memberships');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ memberships: MembershipData[] }>;
    },
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['portal-upcoming-booking'],
    queryFn: async () => {
      const res = await fetch('/api/portal/bookings?status=upcoming&limit=1');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<BookingsResponse>;
    },
  });

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstName = profileData?.profile?.firstName || '';
  const activeMembership = membData?.memberships?.find((m) => m.status === 'ACTIVE');
  const nextBooking = bookingsData?.bookings?.[0];

  return (
    <div className="p-4">
      <h2 className="mb-6 text-xl font-bold">
        {firstName ? `שלום, ${firstName}!` : 'שלום!'}
      </h2>

      {/* Active membership summary */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">המנוי שלי</h3>
          <Link href="/portal/membership" className="text-sm text-primary hover:underline">
            לכל המנויים
          </Link>
        </div>
        {activeMembership ? (
          <MembershipCard membership={activeMembership} />
        ) : (
          <EmptyState
            icon={CreditCard}
            title="אין מנוי פעיל"
            description="אנא פנה/י למועדון לרכישת מנוי"
          />
        )}
      </div>

      {/* Next upcoming class */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">השיעור הבא</h3>
          <Link href="/portal/bookings" className="text-sm text-primary hover:underline">
            כל ההזמנות
          </Link>
        </div>
        {nextBooking ? (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{nextBooking.classInstance.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(nextBooking.classInstance.startTime), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="אין שיעורים קרובים"
            description="הזמינ/י מקום בשיעור הבא"
            actionLabel="לשיעורים"
            actionHref="/portal/classes"
          />
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
          <Link href="/portal/classes">
            <BookOpen className="h-6 w-6" />
            <span>שיעורים</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
          <Link href="/portal/bookings">
            <ClipboardList className="h-6 w-6" />
            <span>הזמנות</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
