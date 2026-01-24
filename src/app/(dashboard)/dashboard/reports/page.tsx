'use client';

import { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ReportData {
  revenue: {
    total: number;
    change: number;
    isPositive: boolean;
    transactionCount: number;
  };
  memberships: {
    total: number;
    newThisMonth: number;
    churned: number;
    change: number;
    isPositive: boolean;
  };
  attendance: {
    totalClasses: number;
    totalAttendees: number;
    avgUtilization: number;
    change: number;
    isPositive: boolean;
  };
  topClasses: {
    name: string;
    attendees: number;
    utilization: number;
    instances: number;
  }[];
  recentPayments: {
    id: string;
    customer: string;
    amount: number;
    type: string;
    date: string;
  }[];
  charts: {
    revenue: { date: string; amount: number }[];
    attendance: { date: string; attendees: number; capacity: number }[];
  };
  period: string;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/reports?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('שגיאה בטעינת הדוחות');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd בMMM', { locale: he });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchReports}>נסה שוב</Button>
      </div>
    );
  }

  if (!data) return null;

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
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.total)}</div>
            <div className="flex items-center gap-1 text-sm">
              {data.revenue.isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  data.revenue.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {data.revenue.isPositive ? '+' : ''}
                {data.revenue.change}%
              </span>
              <span className="text-muted-foreground">מהתקופה הקודמת</span>
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
            <div className="text-2xl font-bold">{data.memberships.total}</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-success">+{data.memberships.newThisMonth} חדשים</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-destructive">-{data.memberships.churned} עזבו</span>
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
            <div className="text-2xl font-bold">{data.attendance.avgUtilization}%</div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">
                {data.attendance.totalAttendees} משתתפים ב-{data.attendance.totalClasses} שיעורים
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">הכנסות לאורך זמן</CardTitle>
            <CardDescription>התפלגות הכנסות יומית</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data.charts.revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.charts.revenue}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₪${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'הכנסות']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12" />
                    <p className="mt-2">אין נתונים להצגה</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">נוכחות לאורך זמן</CardTitle>
            <CardDescription>משתתפים מול קיבולת</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data.charts.attendance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.charts.attendance}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="capacity"
                      name="קיבולת"
                      fill="hsl(var(--muted-foreground))"
                      opacity={0.3}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="attendees"
                      name="משתתפים"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12" />
                    <p className="mt-2">אין נתונים להצגה</p>
                  </div>
                </div>
              )}
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
              {data.topClasses.length > 0 ? (
                data.topClasses.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-medium">{cls.name}</span>
                        <p className="text-xs text-muted-foreground">{cls.instances} שיעורים</p>
                      </div>
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
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  אין שיעורים בתקופה זו
                </div>
              )}
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
              {data.recentPayments.length > 0 ? (
                data.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{payment.customer}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.type} • {formatDate(payment.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-success">
                      +{formatCurrency(payment.amount)}
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  אין תשלומים להצגה
                </div>
              )}
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
