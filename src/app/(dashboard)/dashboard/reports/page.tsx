'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Calendar,
  Download,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

// Mock data
const revenueData = {
  total: 45250,
  change: 12.5,
  isPositive: true,
};

const membershipData = {
  total: 156,
  newThisMonth: 12,
  churned: 3,
  change: 8.2,
  isPositive: true,
};

const attendanceData = {
  totalClasses: 87,
  totalAttendees: 892,
  avgUtilization: 78,
  change: 5.1,
  isPositive: true,
};

const topClasses = [
  { name: 'יוגה בוקר', attendees: 145, utilization: 92 },
  { name: 'פילאטיס', attendees: 98, utilization: 85 },
  { name: 'HIIT', attendees: 87, utilization: 78 },
  { name: 'יוגה ערב', attendees: 76, utilization: 72 },
];

const recentPayments = [
  { customer: 'רחל דוידוביץ', amount: 350, type: 'מנוי חודשי', date: '15.01.2024' },
  { customer: 'אורי כהן', amount: 500, type: 'כרטיסייה', date: '14.01.2024' },
  { customer: 'יעל אברהם', amount: 65, type: 'Drop-in', date: '14.01.2024' },
  { customer: 'דני לוי', amount: 350, type: 'מנוי חודשי', date: '13.01.2024' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">דוחות</h1>
          <p className="text-muted-foreground">סקירת ביצועים ונתונים</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border p-1">
            <Button
              variant={period === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('week')}
            >
              שבוע
            </Button>
            <Button
              variant={period === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('month')}
            >
              חודש
            </Button>
            <Button
              variant={period === 'quarter' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('quarter')}
            >
              רבעון
            </Button>
          </div>
          <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            ייצוא
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueData.total)}</div>
            <div className="flex items-center gap-1 text-sm">
              {revenueData.isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  revenueData.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {revenueData.isPositive ? '+' : ''}
                {revenueData.change}%
              </span>
              <span className="text-muted-foreground">מהחודש הקודם</span>
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מתאמנים פעילים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membershipData.total}</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-success">+{membershipData.newThisMonth} חדשים</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-destructive">-{membershipData.churned} עזבו</span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ניצולת שיעורים</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData.avgUtilization}%</div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">
                {attendanceData.totalAttendees} משתתפים ב-{attendanceData.totalClasses} שיעורים
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">הכנסות לאורך זמן</CardTitle>
            <CardDescription>התפלגות הכנסות חודשית</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12" />
                <p className="mt-2">גרף הכנסות</p>
                <p className="text-sm">בקרוב...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">נוכחות לאורך זמן</CardTitle>
            <CardDescription>מגמת נוכחות שבועית</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12" />
                <p className="mt-2">גרף נוכחות</p>
                <p className="text-sm">בקרוב...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">שיעורים מובילים</CardTitle>
            <CardDescription>לפי מספר משתתפים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClasses.map((cls, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium">{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{cls.attendees} משתתפים</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5',
                        cls.utilization >= 80
                          ? 'bg-success/10 text-success'
                          : cls.utilization >= 60
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {cls.utilization}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">תשלומים אחרונים</CardTitle>
            <CardDescription>5 התשלומים האחרונים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{payment.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.type} • {payment.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-success">
                    +{formatCurrency(payment.amount)}
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">דוחות מהירים</CardTitle>
          <CardDescription>הורד דוחות מוכנים</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <CreditCard className="h-6 w-6" />
              <span>דוח הכנסות</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <Users className="h-6 w-6" />
              <span>דוח מתאמנים</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <Calendar className="h-6 w-6" />
              <span>דוח נוכחות</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <BarChart3 className="h-6 w-6" />
              <span>דוח ניצולת</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
