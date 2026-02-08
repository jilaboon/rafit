'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RevenueData {
  current: {
    amount: number;
    count: number;
    period: string;
  };
  previous: {
    amount: number;
    count: number;
  };
  pending: {
    amount: number;
    count: number;
  };
  memberships: {
    new: number;
    expiring: number;
  };
  percentageChange: number;
  currency: string;
}

interface RevenueWidgetProps {
  showViewAll?: boolean;
  showDetails?: boolean;
  period?: 'day' | 'week' | 'month' | 'year';
}

export function RevenueWidget({
  showViewAll = true,
  showDetails = false,
  period = 'month'
}: RevenueWidgetProps) {
  const { data: revenue, isLoading } = useQuery<RevenueData>({
    queryKey: ['dashboard-revenue', period],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/revenue?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch revenue');
      return response.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          הכנסות
        </CardTitle>
        {showViewAll && (
          <Link href="/dashboard/reports/revenue">
            <Button variant="ghost" size="sm">
              דוחות מלאים
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
        ) : revenue ? (
          <div className="space-y-4">
            {/* Main stat - Current Period */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">
                {revenue.current.period === 'month' ? 'החודש' :
                 revenue.current.period === 'week' ? 'השבוע' :
                 revenue.current.period === 'day' ? 'היום' : 'השנה'}
              </p>
              <p className="text-3xl font-bold">{formatCurrency(revenue.current.amount)}</p>
              <div
                className={cn(
                  'flex items-center justify-center gap-1 mt-2 text-sm',
                  revenue.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {revenue.percentageChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {revenue.percentageChange >= 0 ? '+' : ''}
                  {revenue.percentageChange}% מהתקופה הקודמת
                </span>
              </div>
            </div>

            {showDetails && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm text-muted-foreground">תקופה קודמת</p>
                    <p className="text-xl font-semibold">{formatCurrency(revenue.previous.amount)}</p>
                    <p className="text-xs text-muted-foreground">{revenue.previous.count} תשלומים</p>
                  </div>
                  <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20">
                    <p className="text-sm text-muted-foreground">ממתינים לתשלום</p>
                    <p className="text-xl font-semibold text-yellow-600">{formatCurrency(revenue.pending.amount)}</p>
                    <p className="text-xs text-muted-foreground">{revenue.pending.count} תשלומים</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20">
                    <p className="text-sm text-muted-foreground">מנויים חדשים</p>
                    <p className="text-xl font-semibold text-green-600">{revenue.memberships.new}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-50 dark:bg-orange-950/20">
                    <p className="text-sm text-muted-foreground">מנויים פוקעים (30 יום)</p>
                    <p className="text-xl font-semibold text-orange-600">{revenue.memberships.expiring}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            לא ניתן לטעון נתוני הכנסות
          </p>
        )}
      </CardContent>
    </Card>
  );
}
