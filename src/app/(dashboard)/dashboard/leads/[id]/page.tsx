'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  ArrowLeftRight,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Loader2,
  Plus,
  Eye,
  PhoneCall,
  MessageSquare,
  Users,
  FileText,
  Zap,
  ChevronLeft,
} from 'lucide-react';
import { cn, formatDate, getInitials } from '@/lib/utils';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'TRIAL' | 'CONVERTED' | 'LOST';

interface LeadCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  source?: string;
  leadStatus: LeadStatus;
  tags: string[];
  notes?: string;
  createdAt: string;
  memberships: {
    id: string;
    status: string;
    plan: { name: string; type: string; price: number };
  }[];
}

interface LeadActivity {
  id: string;
  type: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  type: string;
  price: number;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  NEW: { label: 'חדש', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  CONTACTED: { label: 'נוצר קשר', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  QUALIFIED: { label: 'פוטנציאלי', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  TRIAL: { label: 'ניסיון', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
  CONVERTED: { label: 'הומר', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  LOST: { label: 'אבוד', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
};

const PIPELINE_STAGES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'TRIAL', 'CONVERTED'];

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['TRIAL', 'LOST'],
  TRIAL: ['CONVERTED', 'LOST'],
  CONVERTED: [],
  LOST: [],
};

const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; icon: typeof Phone }> = {
  CALL: { label: 'שיחה', icon: PhoneCall },
  EMAIL: { label: 'אימייל', icon: MessageSquare },
  MEETING: { label: 'פגישה', icon: Users },
  NOTE: { label: 'הערה', icon: FileText },
  STATUS_CHANGE: { label: 'שינוי סטטוס', icon: ArrowLeftRight },
  CONVERSION: { label: 'המרה', icon: Zap },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const leadId = params.id as string;

  // Dialog state
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus | ''>('');
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [activityType, setActivityType] = useState('NOTE');
  const [activityDescription, setActivityDescription] = useState('');
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('none');

  // Fetch lead (customer) data
  const { data: leadData, isLoading } = useQuery<{ customer: LeadCustomer }>({
    queryKey: ['customer', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${leadId}`);
      if (!res.ok) throw new Error('Failed to fetch lead');
      return res.json();
    },
  });

  const lead = leadData?.customer;

  // Fetch activities
  const { data: activitiesData } = useQuery<{ activities: LeadActivity[] }>({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/activities`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
  });

  const activities = activitiesData?.activities ?? [];

  // Fetch membership plans (for convert dialog)
  const { data: plansData } = useQuery<{ plans: MembershipPlan[] }>({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const res = await fetch('/api/membership-plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
    enabled: showConvertDialog,
  });

  const membershipPlans = plansData?.plans ?? [];

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'שגיאה בעדכון סטטוס');
      return data;
    },
    onSuccess: () => {
      setShowStatusDialog(false);
      setNewStatus('');
      queryClient.invalidateQueries({ queryKey: ['customer', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
    },
    onError: (error: Error) => alert(error.message),
  });

  // Add activity mutation
  const activityMutation = useMutation({
    mutationFn: async ({ type, description }: { type: string; description: string }) => {
      const res = await fetch(`/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'שגיאה ביצירת פעילות');
      return data;
    },
    onSuccess: () => {
      setShowActivityDialog(false);
      setActivityType('NOTE');
      setActivityDescription('');
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
    },
    onError: (error: Error) => alert(error.message),
  });

  // Convert mutation
  const convertMutation = useMutation({
    mutationFn: async ({ membershipPlanId }: { membershipPlanId?: string }) => {
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(membershipPlanId ? { membershipPlanId } : {}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'שגיאה בהמרת ליד');
      return data;
    },
    onSuccess: () => {
      setShowConvertDialog(false);
      setSelectedPlanId('none');
      queryClient.invalidateQueries({ queryKey: ['customer', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => alert(error.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-medium">ליד לא נמצא</p>
        <Link href="/dashboard/leads">
          <Button variant="outline" className="mt-4">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה לרשימת הלידים
          </Button>
        </Link>
      </div>
    );
  }

  const isTerminal = lead.leadStatus === 'CONVERTED' || lead.leadStatus === 'LOST';
  const canConvert = !isTerminal;
  const transitions = VALID_TRANSITIONS[lead.leadStatus];
  const currentStageIndex = PIPELINE_STAGES.indexOf(lead.leadStatus);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/leads" className="hover:text-foreground">
          לידים
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <span>{lead.firstName} {lead.lastName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getInitials(`${lead.firstName} ${lead.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{lead.firstName} {lead.lastName}</h1>
              <Badge
                variant="secondary"
                className={cn('text-sm', STATUS_CONFIG[lead.leadStatus]?.color)}
              >
                {STATUS_CONFIG[lead.leadStatus]?.label}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {lead.email}
              </span>
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </span>
              )}
              {lead.source && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  מקור: {lead.source}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                נוצר: {formatDate(lead.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canConvert && (
            <Button onClick={() => setShowConvertDialog(true)}>
              <UserCheck className="ml-2 h-4 w-4" />
              המר ללקוח
            </Button>
          )}
          {transitions.length > 0 && (
            <Button variant="outline" onClick={() => setShowStatusDialog(true)}>
              <ArrowLeftRight className="ml-2 h-4 w-4" />
              שנה סטטוס
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowActivityDialog(true)}>
            <Plus className="ml-2 h-4 w-4" />
            הוסף פעילות
          </Button>
          <Link href={`/dashboard/customers/${leadId}`}>
            <Button variant="ghost">
              <Eye className="ml-2 h-4 w-4" />
              פרופיל מלא
            </Button>
          </Link>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-1">
            {PIPELINE_STAGES.map((stage, index) => {
              const isActive = stage === lead.leadStatus;
              const isPassed = lead.leadStatus === 'LOST'
                ? false
                : currentStageIndex >= 0 && index <= currentStageIndex;

              return (
                <div key={stage} className="flex flex-1 items-center">
                  <div
                    className={cn(
                      'flex h-10 flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isPassed
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {STATUS_CONFIG[stage].label}
                  </div>
                  {index < PIPELINE_STAGES.length - 1 && (
                    <ChevronLeft className={cn(
                      'mx-0.5 h-4 w-4 shrink-0',
                      isPassed ? 'text-primary' : 'text-muted-foreground/30'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
          {lead.leadStatus === 'LOST' && (
            <div className="mt-2 rounded-md bg-red-50 p-2 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              ליד אבוד
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Timeline - main column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">היסטוריית פעילות</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowActivityDialog(true)}>
                <Plus className="ml-2 h-4 w-4" />
                פעילות חדשה
              </Button>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">אין פעילויות עדיין</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowActivityDialog(true)}
                  >
                    הוסף פעילות ראשונה
                  </Button>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute right-4 top-0 bottom-0 w-px bg-border" />

                  {activities.map((activity, index) => {
                    const config = ACTIVITY_TYPE_CONFIG[activity.type] ?? {
                      label: activity.type,
                      icon: FileText,
                    };
                    const Icon = config.icon;

                    return (
                      <div key={activity.id} className="relative flex gap-4 pb-6">
                        {/* Timeline dot */}
                        <div className={cn(
                          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background',
                          index === 0 ? 'border-primary' : 'border-muted-foreground/30'
                        )}>
                          <Icon className={cn(
                            'h-4 w-4',
                            index === 0 ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{config.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(activity.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - contact info & quick details */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פרטי קשר</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">אימייל</p>
                <p className="text-sm">{lead.email}</p>
              </div>
              {lead.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">טלפון</p>
                  <p className="text-sm">{lead.phone}</p>
                </div>
              )}
              {lead.dateOfBirth && (
                <div>
                  <p className="text-xs text-muted-foreground">תאריך לידה</p>
                  <p className="text-sm">{formatDate(lead.dateOfBirth)}</p>
                </div>
              )}
              {lead.address && (
                <div>
                  <p className="text-xs text-muted-foreground">כתובת</p>
                  <p className="text-sm">{lead.address}</p>
                </div>
              )}
              {lead.source && (
                <div>
                  <p className="text-xs text-muted-foreground">מקור</p>
                  <p className="text-sm">{lead.source}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {lead.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">תגיות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">הערות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{lead.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סטטיסטיקה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">פעילויות</span>
                <span className="font-medium">{activities.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ימים במערכת</span>
                <span className="font-medium">
                  {Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">מנויים</span>
                <span className="font-medium">{lead.memberships.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שינוי סטטוס ליד</DialogTitle>
            <DialogDescription>
              שנה את הסטטוס של {lead.firstName} {lead.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              סטטוס נוכחי:{' '}
              <Badge variant="secondary" className={cn('text-xs', STATUS_CONFIG[lead.leadStatus]?.color)}>
                {STATUS_CONFIG[lead.leadStatus]?.label}
              </Badge>
            </p>
            <Select value={newStatus} onValueChange={(val) => setNewStatus(val as LeadStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס חדש" />
              </SelectTrigger>
              <SelectContent>
                {transitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>ביטול</Button>
            <Button
              onClick={() => {
                if (newStatus) statusMutation.mutate({ status: newStatus });
              }}
              disabled={!newStatus || statusMutation.isPending}
            >
              {statusMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              עדכן סטטוס
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף פעילות</DialogTitle>
            <DialogDescription>
              תעד אינטראקציה עם {lead.firstName} {lead.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>סוג פעילות</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">שיחה</SelectItem>
                  <SelectItem value="EMAIL">אימייל</SelectItem>
                  <SelectItem value="MEETING">פגישה</SelectItem>
                  <SelectItem value="NOTE">הערה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="תאר את הפעילות..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityDialog(false)}>ביטול</Button>
            <Button
              onClick={() => {
                if (activityDescription.trim()) {
                  activityMutation.mutate({
                    type: activityType,
                    description: activityDescription.trim(),
                  });
                }
              }}
              disabled={!activityDescription.trim() || activityMutation.isPending}
            >
              {activityMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={(open) => {
        setShowConvertDialog(open);
        if (!open) setSelectedPlanId('none');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>המרת ליד ללקוח</DialogTitle>
            <DialogDescription>
              המרת {lead.firstName} {lead.lastName} ללקוח פעיל במערכת.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>הקצאת מנוי (אופציונלי)</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תוכנית מנוי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא מנוי - המרה בלבד</SelectItem>
                  {membershipPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <span className="flex items-center gap-2">
                        {plan.name}
                        <span className="text-muted-foreground">
                          ({plan.price > 0 ? `₪${plan.price}` : 'חינם'})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedPlanId !== 'none'
                  ? 'מנוי פעיל ייוצר אוטומטית ללקוח החדש'
                  : 'תוכל להקצות מנוי מאוחר יותר מפרופיל הלקוח'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConvertDialog(false);
              setSelectedPlanId('none');
            }}>
              ביטול
            </Button>
            <Button
              onClick={() => {
                convertMutation.mutate({
                  membershipPlanId: selectedPlanId !== 'none' ? selectedPlanId : undefined,
                });
              }}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <UserCheck className="ml-2 h-4 w-4" />
              המר ללקוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
