'use client';

import { useEffect, useState } from 'react';
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
  const [bookings, setBookings] = useState<PendingCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [limit]);

  async function fetchBookings() {
    try {
      const response = await fetch(`/api/dashboard/pending-checkins?limit=${limit}`);
      const data = await response.json();
      if (response.ok) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to fetch pending check-ins:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckin(bookingId: string) {
    setCheckingIn(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: 'POST',
      });
      if (response.ok) {
        // Remove from list
        setBookings(bookings.filter((b) => b.id !== bookingId));
      }
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setCheckingIn(null);
    }
  }

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
                  onClick={() => handleCheckin(booking.id)}
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
