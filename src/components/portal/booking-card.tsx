'use client';

import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  CONFIRMED: { label: '\u05DE\u05D0\u05D5\u05E9\u05E8', variant: 'default' },
  WAITLISTED: { label: '\u05E8\u05E9\u05D9\u05DE\u05EA \u05D4\u05DE\u05EA\u05E0\u05D4', variant: 'outline' },
  COMPLETED: { label: '\u05D4\u05D5\u05E9\u05DC\u05DD', variant: 'secondary' },
  CANCELLED: { label: '\u05D1\u05D5\u05D8\u05DC', variant: 'destructive' },
  NO_SHOW: { label: '\u05DC\u05D0 \u05D4\u05D2\u05D9\u05E2', variant: 'destructive' },
};

export interface BookingCardData {
  id: string;
  status: string;
  bookedAt: string;
  waitlistPosition: number | null;
  classInstance: {
    name: string;
    startTime: string;
    endTime: string;
    branchName: string;
    coachName: string | null;
  };
}

interface BookingCardProps {
  booking: BookingCardData;
  onCancel?: (bookingId: string) => void;
  isCancelling?: boolean;
}

export function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
  const startTime = new Date(booking.classInstance.startTime);
  const endTime = new Date(booking.classInstance.endTime);
  const statusInfo = STATUS_MAP[booking.status] || { label: booking.status, variant: 'outline' as const };
  const canCancel = onCancel && ['CONFIRMED', 'WAITLISTED'].includes(booking.status);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{booking.classInstance.name}</h3>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(startTime, 'EEEE, d \u05D1MMMM', { locale: he })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </span>
            {booking.classInstance.coachName && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {booking.classInstance.coachName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {booking.classInstance.branchName}
            </span>
          </div>
        </div>
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="mr-3 text-destructive"
            onClick={() => onCancel(booking.id)}
            disabled={isCancelling}
          >
            {'\u05D1\u05D9\u05D8\u05D5\u05DC'}
          </Button>
        )}
      </div>
    </div>
  );
}
