'use client';

import { Badge } from '@/components/ui/badge';
import { ProgressBar } from './progress-bar';
import { format } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ACTIVE: { label: 'פעיל', variant: 'default' },
  PAUSED: { label: 'מושהה', variant: 'outline' },
  EXPIRED: { label: 'פג תוקף', variant: 'secondary' },
  CANCELLED: { label: 'בוטל', variant: 'destructive' },
};

const TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION: 'מנוי',
  PUNCH_CARD: 'כרטיסייה',
  CREDITS: 'קרדיטים',
  TRIAL: 'ניסיון',
  DROP_IN: 'כניסה בודדת',
};

export interface MembershipData {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  sessionsRemaining: number | null;
  creditsRemaining: number | null;
  plan: {
    name: string;
    type: string;
    price: number;
    totalSessions: number | null;
    totalCredits: number | null;
  };
}

export function MembershipCard({ membership }: { membership: MembershipData }) {
  const statusInfo = STATUS_MAP[membership.status] || { label: membership.status, variant: 'outline' as const };
  const isActive = membership.status === 'ACTIVE';

  return (
    <div className={`rounded-xl border bg-card p-4 ${isActive ? 'border-primary/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{membership.plan.name}</h3>
          <span className="text-sm text-muted-foreground">{TYPE_LABELS[membership.plan.type] || membership.plan.type}</span>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {membership.plan.type === 'PUNCH_CARD' && membership.plan.totalSessions != null && (
        <div className="mt-3">
          <ProgressBar
            used={(membership.plan.totalSessions) - (membership.sessionsRemaining || 0)}
            total={membership.plan.totalSessions}
            label="כניסות"
          />
        </div>
      )}

      {membership.plan.type === 'CREDITS' && membership.plan.totalCredits != null && (
        <div className="mt-3">
          <ProgressBar
            used={(membership.plan.totalCredits) - (membership.creditsRemaining || 0)}
            total={membership.plan.totalCredits}
            label="קרדיטים"
          />
        </div>
      )}

      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span>מ-{format(new Date(membership.startDate), 'd/M/yyyy')}</span>
        {membership.endDate && (
          <span>עד {format(new Date(membership.endDate), 'd/M/yyyy')}</span>
        )}
      </div>
    </div>
  );
}
