import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  UserPlus,
  Clock,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// Mock data - will be replaced with real data
const stats = [
  {
    title: 'שיעורים היום',
    value: '8',
    change: '+2 מאתמול',
    icon: Calendar,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'הזמנות היום',
    value: '47',
    change: '+12 מאתמול',
    icon: Users,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    title: 'הכנסות החודש',
    value: '₪24,350',
    change: '+8.2%',
    icon: CreditCard,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    title: 'מתאמנים פעילים',
    value: '156',
    change: '+5 החודש',
    icon: TrendingUp,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

const upcomingClasses = [
  { name: 'יוגה בוקר', time: '07:00', coach: 'מיכל כהן', booked: 12, capacity: 15 },
  { name: 'פילאטיס', time: '09:00', coach: 'דנה לוי', booked: 8, capacity: 10 },
  { name: 'HIIT', time: '10:30', coach: 'יואב שמש', booked: 15, capacity: 15 },
  { name: 'יוגה ערב', time: '18:00', coach: 'מיכל כהן', booked: 10, capacity: 15 },
];

const recentActivity = [
  { type: 'booking', text: 'רות דוידוביץ נרשמה ליוגה בוקר', time: 'לפני 5 דקות' },
  { type: 'payment', text: 'תשלום התקבל מאורי כהן - ₪350', time: 'לפני 12 דקות' },
  { type: 'member', text: 'חבר חדש: יעל אברהם', time: 'לפני 30 דקות' },
  { type: 'cancel', text: 'דני לוי ביטל הזמנה ל-HIIT', time: 'לפני שעה' },
];

const alerts = [
  { type: 'warning', text: '3 מנויים עומדים לפוג החודש' },
  { type: 'info', text: 'שיעור פילאטיס מלא - 2 בהמתנה' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">לוח בקרה</h1>
          <p className="text-muted-foreground">ברוכים הבאים! הנה סיכום הפעילות שלך</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/schedule/new">
            <Button>
              <Calendar className="ml-2 h-4 w-4" />
              שיעור חדש
            </Button>
          </Link>
          <Link href="/dashboard/customers/new">
            <Button variant="outline">
              <UserPlus className="ml-2 h-4 w-4" />
              לקוח חדש
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border border-warning/50 bg-warning/10 p-3"
            >
              <AlertCircle className="h-5 w-5 text-warning" />
              <span className="text-sm">{alert.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-xs text-success">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">שיעורים קרובים</CardTitle>
              <CardDescription>השיעורים הבאים היום</CardDescription>
            </div>
            <Link href="/dashboard/schedule">
              <Button variant="ghost" size="sm">
                הכל
                <ChevronLeft className="mr-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingClasses.map((cls, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.time} • {cls.coach}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-medium ${
                        cls.booked >= cls.capacity ? 'text-destructive' : 'text-success'
                      }`}
                    >
                      {cls.booked}/{cls.capacity}
                    </p>
                    <p className="text-xs text-muted-foreground">נרשמו</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">פעילות אחרונה</CardTitle>
              <CardDescription>מה קרה לאחרונה בסטודיו</CardDescription>
            </div>
            <Link href="/dashboard/activity">
              <Button variant="ghost" size="sm">
                הכל
                <ChevronLeft className="mr-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/checkin">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <Users className="h-6 w-6" />
                <span>צ&apos;ק-אין</span>
              </Button>
            </Link>
            <Link href="/dashboard/bookings/new">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <Calendar className="h-6 w-6" />
                <span>הזמנה חדשה</span>
              </Button>
            </Link>
            <Link href="/dashboard/payments/new">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <CreditCard className="h-6 w-6" />
                <span>קבלת תשלום</span>
              </Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <TrendingUp className="h-6 w-6" />
                <span>דוחות</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
