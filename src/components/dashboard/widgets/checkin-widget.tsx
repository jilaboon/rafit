'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClipboardCheck, Clock, ChevronLeft, Check } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface PendingCheckin {
  id: string;
  customerName: string;
  customerEmail: string;
  className: string;
  classTime: string;
  status: string;
}

interface CheckinWidgetProps {
  limit?: number;
  showViewAll?: boolean;
}

export function CheckinWidget({ limit = 5, showViewAll = true }: CheckinWidgetProps) {
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ bookings: PendingCheckin[] }>({
    queryKey: ['dashboard-pending-checkins', limit],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/pending-checkins?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch pending check-ins');
      return response.json();
    },
  });

  const bookings = data?.bookings ?? [];

  const checkinMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to check in');
      return response.json();
    },
    onMutate: (bookingId) => {
      setCheckingIn(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-pending-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-today-classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onSettled: () => {
      setCheckingIn(null);
    },
  });

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          ממתינים לצ'ק-אין
        </CardTitle>
        {showViewAll && (
          <Link href="/dashboard/checkin">
            <Button variant="ghost" size="sm">
              צ'ק-אין מלא
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            אין ממתינים לצ'ק-אין
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(booking.customerName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{booking.className}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(booking.classTime)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => checkinMutation.mutate(booking.id)}
                  disabled={checkingIn === booking.id}
                >
                  {checkingIn === booking.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check className="h-4 w-4 ml-1" />
                      צ'ק-אין
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
