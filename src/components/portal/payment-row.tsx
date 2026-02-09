'use client';

import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'ממתין', variant: 'outline' },
  COMPLETED: { label: 'שולם', variant: 'default' },
  FAILED: { label: 'נכשל', variant: 'destructive' },
  REFUNDED: { label: 'הוחזר', variant: 'secondary' },
  PARTIALLY_REFUNDED: { label: 'הוחזר חלקית', variant: 'secondary' },
};

export interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
}

export function PaymentRow({ payment }: { payment: PaymentData }) {
  const statusInfo = STATUS_MAP[payment.status] || { label: payment.status, variant: 'outline' as const };

  return (
    <div className="flex items-center justify-between border-b py-3 last:border-b-0">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{payment.description || 'תשלום'}</span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(payment.createdAt), 'd/M/yyyy')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        <span className="font-semibold">
          {'\u20AA'}{payment.amount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
