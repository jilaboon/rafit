'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Cake,
  CreditCard,
  Activity,
  Loader2,
  User,
  Shield,
  Tag,
  Clock,
} from 'lucide-react';
import { cn, formatDate, formatDateTime, formatCurrency, getInitials } from '@/lib/utils';

// --- Types matching API response ---

interface MembershipPlan {
  name: string;
  type: string;
  price: string;
  billingCycle?: string;
}

interface Membership {
  id: string;
  status: string;
  startDate: string;
  endDate?: string;
  sessionsRemaining?: number;
  creditsRemaining?: number;
  autoRenew: boolean;
  plan: MembershipPlan;
}

interface ClassInstance {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface Booking {
  id: string;
  status: string;
  bookedAt: string;
  checkedInAt?: string;
  cancelledAt?: string;
  source: string;
  classInstance: ClassInstance;
}

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  medicalNotes?: string;
  tags: string[];
  source?: string;
  leadStatus: string;
  marketingConsent: boolean;
  createdAt: string;
  memberships: Membership[];
  bookings: Booking[];
  payments: Payment[];
  totalVisits: number;
}

// --- Status labels ---

const leadStatusLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: 'חדש', color: 'bg-primary/10 text-primary' },
  CONTACTED: { label: 'נוצר קשר', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  QUALIFIED: { label: 'מתעניין', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  TRIAL: { label: 'ניסיון', color: 'bg-warning/10 text-warning' },
  CONVERTED: { label: 'לקוח', color: 'bg-success/10 text-success' },
  LOST: { label: 'אבוד', color: 'bg-destructive/10 text-destructive' },
};

const membershipStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ACTIVE: { label: 'פעיל', variant: 'default' },
  PAUSED: { label: 'מושהה', variant: 'secondary' },
  EXPIRED: { label: 'פג תוקף', variant: 'destructive' },
  CANCELLED: { label: 'בוטל', variant: 'destructive' },
};

const bookingStatusLabels: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: 'מאושר', color: 'bg-primary/10 text-primary' },
  COMPLETED: { label: 'הושלם', color: 'bg-success/10 text-success' },
  CANCELLED: { label: 'בוטל', color: 'bg-muted text-muted-foreground' },
  NO_SHOW: { label: 'לא הגיע', color: 'bg-destructive/10 text-destructive' },
  WAITLISTED: { label: 'רשימת המתנה', color: 'bg-warning/10 text-warning' },
};

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'ממתין', color: 'bg-warning/10 text-warning' },
  COMPLETED: { label: 'שולם', color: 'bg-success/10 text-success' },
  FAILED: { label: 'נכשל', color: 'bg-destructive/10 text-destructive' },
  REFUNDED: { label: 'הוחזר', color: 'bg-muted text-muted-foreground' },
  PARTIALLY_REFUNDED: { label: 'הוחזר חלקית', color: 'bg-muted text-muted-foreground' },
};

const membershipTypeLabels: Record<string, string> = {
  SUBSCRIPTION: 'מנוי',
  PUNCH_CARD: 'כרטיסייה',
  CREDITS: 'קרדיטים',
  TRIAL: 'ניסיון',
  DROP_IN: 'כניסה בודדת',
};

// --- Helper ---

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

// --- Page ---

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, error } = useQuery<{ customer: CustomerDetail }>({
    queryKey: ['customer', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${params.id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'שגיאה בטעינת הלקוח');
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowRight className="ml-2 h-4 w-4" />
          חזרה
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">לקוח לא נמצא</p>
            <p className="text-sm text-muted-foreground">
              {error?.message || 'הלקוח המבוקש לא נמצא במערכת'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customer = data.customer;
  const fullName = `${customer.firstName} ${customer.lastName}`;
  const leadStatus = leadStatusLabels[customer.leadStatus];

  // Birthday check
  const today = new Date();
  let isBirthday = false;
  if (customer.dateOfBirth) {
    const dob = new Date(customer.dateOfBirth);
    isBirthday = dob.getUTCMonth() === today.getMonth() && dob.getUTCDate() === today.getDate();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/dashboard/customers">
        <Button variant="ghost" size="sm">
          <ArrowRight className="ml-2 h-4 w-4" />
          חזרה ללקוחות
        </Button>
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  {leadStatus && (
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', leadStatus.color)}>
                      {leadStatus.label}
                    </span>
                  )}
                  {isBirthday && (
                    <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                      <Cake className="ml-1 h-3 w-3" />
                      יום הולדת!
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </span>
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    {customer.totalVisits} ביקורים
                  </span>
                </div>
                {customer.tags.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {customer.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="text-left text-sm text-muted-foreground">
              <p>הצטרף: {formatDate(customer.createdAt)}</p>
              {customer.source && <p>מקור: {customer.source}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info + Medical */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פרטים אישיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Mail} label="אימייל" value={customer.email} />
            <InfoRow icon={Phone} label="טלפון" value={customer.phone} />
            <InfoRow
              icon={Calendar}
              label="תאריך לידה"
              value={customer.dateOfBirth ? formatDate(new Date(new Date(customer.dateOfBirth).getUTCFullYear(), new Date(customer.dateOfBirth).getUTCMonth(), new Date(customer.dateOfBirth).getUTCDate())) : undefined}
            />
            <InfoRow icon={User} label="מגדר" value={customer.gender} />
            <InfoRow icon={MapPin} label="כתובת" value={customer.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">אנשי קשר וחירום</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Shield} label="איש קשר לחירום" value={customer.emergencyContact} />
            <InfoRow icon={Phone} label="טלפון חירום" value={customer.emergencyPhone} />

            {customer.medicalNotes && (
              <>
                <Separator className="my-3" />
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">הגבלות רפואיות</p>
                      <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{customer.medicalNotes}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {customer.notes && (
              <>
                <Separator className="my-3" />
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground">הערות</p>
                  <p className="mt-1 text-sm">{customer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Memberships */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">מנויים</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.memberships.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">אין מנויים</p>
          ) : (
            <div className="space-y-3">
              {customer.memberships.map((membership) => {
                const status = membershipStatusLabels[membership.status];
                return (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{membership.plan.name}</p>
                        {status && <Badge variant={status.variant}>{status.label}</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>{membershipTypeLabels[membership.plan.type] || membership.plan.type}</span>
                        <span>{formatDate(membership.startDate)}{membership.endDate ? ` - ${formatDate(membership.endDate)}` : ''}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      {membership.sessionsRemaining != null && (
                        <p className="text-sm font-medium">{membership.sessionsRemaining} כניסות נותרו</p>
                      )}
                      {membership.creditsRemaining != null && (
                        <p className="text-sm font-medium">{membership.creditsRemaining} קרדיטים</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(membership.plan.price))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings & Payments */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              הזמנות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.bookings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">אין הזמנות</p>
            ) : (
              <div className="space-y-2">
                {customer.bookings.map((booking) => {
                  const status = bookingStatusLabels[booking.status];
                  return (
                    <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{booking.classInstance.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(booking.classInstance.startTime)}
                        </p>
                      </div>
                      {status && (
                        <span className={cn('rounded-full px-2 py-0.5 text-xs', status.color)}>
                          {status.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              תשלומים אחרונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.payments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">אין תשלומים</p>
            ) : (
              <div className="space-y-2">
                {customer.payments.map((payment) => {
                  const status = paymentStatusLabels[payment.status];
                  return (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(payment.amount), payment.currency)}
                        </p>
                        {payment.description && (
                          <p className="text-xs text-muted-foreground">{payment.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                      </div>
                      {status && (
                        <span className={cn('rounded-full px-2 py-0.5 text-xs', status.color)}>
                          {status.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
