'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingCard, type BookingCardData } from '@/components/portal/booking-card';
import { CancelBookingDialog } from '@/components/portal/cancel-booking-dialog';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type TabValue = 'upcoming' | 'past';

export default function PortalBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('upcoming');
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['portal-bookings', activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/portal/bookings?status=${activeTab}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ bookings: BookingCardData[] }>;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/portal/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to cancel');
      return json as { message: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['portal-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['portal-classes'] });
      toast({ description: result.message || '\u05D4\u05D4\u05D6\u05DE\u05E0\u05D4 \u05D1\u05D5\u05D8\u05DC\u05D4' });
      setCancelBookingId(null);
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: 'destructive' });
      setCancelBookingId(null);
    },
  });

  const handleCancelClick = useCallback((bookingId: string) => {
    setCancelBookingId(bookingId);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (cancelBookingId) {
      cancelMutation.mutate(cancelBookingId);
    }
  }, [cancelBookingId, cancelMutation]);

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'upcoming', label: '\u05E7\u05E8\u05D5\u05D1\u05D5\u05EA' },
    { value: 'past', label: '\u05E2\u05D1\u05E8' },
  ];

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">{'\u05D4\u05D6\u05DE\u05E0\u05D5\u05EA'}</h2>

      {/* Tab buttons */}
      <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.bookings?.length ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>
            {activeTab === 'upcoming'
              ? '\u05D0\u05D9\u05DF \u05D4\u05D6\u05DE\u05E0\u05D5\u05EA \u05E7\u05E8\u05D5\u05D1\u05D5\u05EA'
              : '\u05D0\u05D9\u05DF \u05D4\u05D6\u05DE\u05E0\u05D5\u05EA \u05E7\u05D5\u05D3\u05DE\u05D5\u05EA'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={activeTab === 'upcoming' ? handleCancelClick : undefined}
              isCancelling={cancelMutation.isPending}
            />
          ))}
        </div>
      )}

      <CancelBookingDialog
        open={cancelBookingId !== null}
        onOpenChange={(open) => {
          if (!open) setCancelBookingId(null);
        }}
        onConfirm={handleCancelConfirm}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
