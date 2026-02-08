'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  customerName: string;
  createdAt: string;
}

interface PaymentsSummary {
  pendingCount: number;
  pendingAmount: number;
  completedToday: number;
  completedTodayAmount: number;
}

interface PaymentsWidgetProps {
  limit?: number;
  showViewAll?: boolean;
  showSummary?: boolean;
}

export function PaymentsWidget({
  limit = 5,
  showViewAll = true,
  showSummary = true,
}: PaymentsWidgetProps) {
  const { data, isLoading } = useQuery<{ payments: Payment[]; summary: PaymentsSummary }>({
    queryKey: ['dashboard-payments', limit],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/payments?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const payments = data?.payments ?? [];
  const summary = data?.summary ?? null;

  const formatCurrency = (amount: number, currency: string = 'ILS') => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    PENDING: { label: 'ממתין', color: 'bg-yellow-500/20 text-yellow-600', icon: AlertCircle },
    COMPLETED: { label: 'הושלם', color: 'bg-green-500/20 text-green-600', icon: CheckCircle },
    FAILED: { label: 'נכשל', color: 'bg-red-500/20 text-red-600', icon: AlertCircle },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          תשלומים
        </CardTitle>
        {showViewAll && (
          <Link href="/dashboard/reports/payments">
            <Button variant="ghost" size="sm">
              כל התשלומים
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
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {showSummary && summary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="flex items-center gap-2 text-yellow-600 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">ממתינים</span>
                  </div>
                  <p className="text-xl font-bold">{summary.pendingCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(summary.pendingAmount)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">היום</span>
                  </div>
                  <p className="text-xl font-bold">{summary.completedToday}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(summary.completedTodayAmount)}
                  </p>
                </div>
              </div>
            )}

            {/* Recent payments */}
            {payments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">תשלומים אחרונים</p>
                {payments.map((payment) => {
                  const config = statusConfig[payment.status] || statusConfig.PENDING;
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{payment.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.description || 'תשלום'} · {formatTime(payment.createdAt)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <Badge variant="secondary" className={cn('text-xs', config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                אין תשלומים אחרונים
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
