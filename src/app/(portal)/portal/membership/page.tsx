'use client';

import { useQuery } from '@tanstack/react-query';
import { MembershipCard, type MembershipData } from '@/components/portal/membership-card';
import { PaymentRow, type PaymentData } from '@/components/portal/payment-row';
import { EmptyState } from '@/components/portal/empty-state';
import { CreditCard, Loader2 } from 'lucide-react';

export default function PortalMembershipPage() {
  const { data: membData, isLoading: membLoading } = useQuery({
    queryKey: ['portal-memberships'],
    queryFn: async () => {
      const res = await fetch('/api/portal/memberships');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ memberships: MembershipData[] }>;
    },
  });

  const { data: payData, isLoading: payLoading } = useQuery({
    queryKey: ['portal-payments'],
    queryFn: async () => {
      const res = await fetch('/api/portal/payments?limit=10');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ payments: PaymentData[]; total: number }>;
    },
  });

  if (membLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">מנוי</h2>

      {!membData?.memberships?.length ? (
        <EmptyState
          icon={CreditCard}
          title="אין מנוי פעיל"
          description="אנא פנה/י למועדון לרכישת מנוי"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {membData.memberships.map((m) => (
            <MembershipCard key={m.id} membership={m} />
          ))}
        </div>
      )}

      <h3 className="mb-3 mt-8 text-lg font-semibold">תשלומים אחרונים</h3>
      {payLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !payData?.payments?.length ? (
        <p className="text-sm text-muted-foreground">אין תשלומים</p>
      ) : (
        <div className="rounded-xl border bg-card px-4">
          {payData.payments.map((p) => (
            <PaymentRow key={p.id} payment={p} />
          ))}
        </div>
      )}
    </div>
  );
}
