'use client';

import {
  RevenueWidget,
  PaymentsWidget,
  DashboardStatsWidget,
} from '../widgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CreditCard, AlertCircle, Calendar } from 'lucide-react';

export function FinanceDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">לוח בקרה פיננסי</h1>
        <p className="text-muted-foreground">סקירת הכנסות ותשלומים</p>
      </div>

      {/* Finance-specific Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-success/10 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">הכנסות החודש</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-primary/10 p-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">תשלומים היום</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-warning/10 p-2">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">תשלומים ממתינים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-secondary/10 p-2">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">מנויים פוקעים</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview - Primary focus */}
      <RevenueWidget showDetails />

      {/* Payments - Full view */}
      <PaymentsWidget limit={10} showSummary />

      {/* Stats for context */}
      <DashboardStatsWidget />
    </div>
  );
}
