'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target,
  Search,
  Users,
  TrendingUp,
  Phone,
  Mail,
  MoreHorizontal,
  UserCheck,
  Loader2,
  ArrowLeftRight,
  Eye,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn, formatDate } from '@/lib/utils';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'TRIAL' | 'CONVERTED' | 'LOST';

interface MembershipPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  billingCycle?: string;
  sessions?: number;
  credits?: number;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  leadStatus: LeadStatus;
  tags: string[];
  createdAt: string;
  lastActivity?: {
    id: string;
    type: string;
    description: string;
    createdAt: string;
  };
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  limit: number;
  offset: number;
  statusCounts: Record<string, number>;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  NEW: { label: 'חדש', color: 'bg-blue-100 text-blue-800' },
  CONTACTED: { label: 'נוצר קשר', color: 'bg-amber-100 text-amber-800' },
  QUALIFIED: { label: 'מוסמך', color: 'bg-purple-100 text-purple-800' },
  TRIAL: { label: 'ניסיון', color: 'bg-green-100 text-green-800' },
  CONVERTED: { label: 'הומר', color: 'bg-emerald-100 text-emerald-800' },
  LOST: { label: 'אבוד', color: 'bg-red-100 text-red-800' },
};

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['TRIAL', 'LOST'],
  TRIAL: ['CONVERTED', 'LOST'],
  CONVERTED: [],
  LOST: [],
};

const STATUS_FILTER_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'NEW', label: 'חדש' },
  { value: 'CONTACTED', label: 'נוצר קשר' },
  { value: 'QUALIFIED', label: 'מוסמך' },
  { value: 'TRIAL', label: 'ניסיון' },
  { value: 'LOST', label: 'אבוד' },
];

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Dialog state
  const [statusChangeTarget, setStatusChangeTarget] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<LeadStatus | ''>('');
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('none');
  const [convertSuccess, setConvertSuccess] = useState<Lead | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useQuery<LeadsResponse>({
    queryKey: ['leads', { search: debouncedSearch, status: statusFilter, source: sourceFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      const response = await fetch(`/api/leads?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const statusCounts = data?.statusCounts ?? {};

  // Fetch membership plans for conversion dialog
  const { data: plansData } = useQuery<{ plans: MembershipPlan[] }>({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const response = await fetch('/api/membership-plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    },
    enabled: !!convertTarget,
  });

  const membershipPlans = plansData?.plans ?? [];

  const statusChangeMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'שגיאה בעדכון סטטוס');
      return data;
    },
    onSuccess: () => {
      setStatusChangeTarget(null);
      setNewStatus('');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const convertMutation = useMutation({
    mutationFn: async ({ id, membershipPlanId }: { id: string; membershipPlanId?: string }) => {
      const response = await fetch(`/api/leads/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(membershipPlanId ? { membershipPlanId } : {}),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'שגיאה בהמרת ליד');
      return data;
    },
    onSuccess: () => {
      setConvertSuccess(convertTarget);
      setConvertTarget(null);
      setSelectedPlanId('none');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleStatusChange = () => {
    if (!statusChangeTarget || !newStatus) return;
    statusChangeMutation.mutate({ id: statusChangeTarget.id, status: newStatus });
  };

  const handleConvert = () => {
    if (!convertTarget) return;
    convertMutation.mutate({
      id: convertTarget.id,
      membershipPlanId: selectedPlanId !== 'none' ? selectedPlanId : undefined,
    });
  };

  // Calculate conversion rate
  const totalAllLeads = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  const convertedCount = statusCounts['CONVERTED'] || 0;
  const conversionRate = totalAllLeads > 0
    ? Math.round((convertedCount / totalAllLeads) * 100)
    : 0;

  // Non-converted total for display
  const activeLeadsTotal = totalAllLeads - convertedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ניהול לידים</h1>
        <p className="text-muted-foreground">מעקב אחר לידים והמרתם ללקוחות</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeLeadsTotal}</p>
              <p className="text-sm text-muted-foreground">סה&quot;כ לידים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts['NEW'] || 0}</p>
              <p className="text-sm text-muted-foreground">לידים חדשים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-purple-100 p-2">
              <UserCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(statusCounts['QUALIFIED'] || 0) + (statusCounts['TRIAL'] || 0)}</p>
              <p className="text-sm text-muted-foreground">מוסמכים + ניסיון</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-100 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{conversionRate}%</p>
              <p className="text-sm text-muted-foreground">אחוז המרה</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם, אימייל או טלפון..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                <SelectItem value="website">אתר</SelectItem>
                <SelectItem value="referral">הפניה</SelectItem>
                <SelectItem value="social">רשתות חברתיות</SelectItem>
                <SelectItem value="walk-in">הגיע ישירות</SelectItem>
                <SelectItem value="phone">טלפון</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status filter tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_FILTER_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={statusFilter === tab.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
                {tab.value !== 'all' && statusCounts[tab.value] !== undefined && (
                  <span className="mr-1 text-xs">({statusCounts[tab.value]})</span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            רשימת לידים
            {total > 0 && <span className="mr-2 text-sm font-normal text-muted-foreground">({total})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">
                {debouncedSearch || statusFilter !== 'all' ? 'לא נמצאו לידים' : 'אין לידים עדיין'}
              </p>
              <p className="text-sm text-muted-foreground">
                {debouncedSearch || statusFilter !== 'all'
                  ? 'נסה לשנות את הסינון'
                  : 'לידים חדשים יופיעו כאן כאשר יתווספו לקוחות חדשים'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => {
                const transitions = VALID_TRANSITIONS[lead.leadStatus];
                const canConvert = lead.leadStatus !== 'CONVERTED' && lead.leadStatus !== 'LOST';

                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {lead.firstName} {lead.lastName}
                        </Link>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            STATUS_CONFIG[lead.leadStatus]?.color
                          )}
                        >
                          {STATUS_CONFIG[lead.leadStatus]?.label}
                        </Badge>
                        {lead.source && (
                          <span className="text-xs text-muted-foreground">
                            ({lead.source})
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.lastActivity && (
                          <span className="text-xs">
                            פעילות אחרונה: {formatDate(lead.lastActivity.createdAt)}
                          </span>
                        )}
                        <span className="text-xs">
                          נוצר: {formatDate(lead.createdAt)}
                        </span>
                      </div>
                      {lead.tags.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {lead.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-muted px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/leads/${lead.id}`}>
                              <Eye className="ml-2 h-4 w-4" />
                              צפה בליד
                            </Link>
                          </DropdownMenuItem>
                          {transitions.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setStatusChangeTarget(lead);
                                setNewStatus('');
                              }}>
                                <ArrowLeftRight className="ml-2 h-4 w-4" />
                                שנה סטטוס
                              </DropdownMenuItem>
                            </>
                          )}
                          {canConvert && (
                            <DropdownMenuItem onClick={() => setConvertTarget(lead)}>
                              <UserCheck className="ml-2 h-4 w-4" />
                              המר ללקוח
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={!!statusChangeTarget} onOpenChange={() => setStatusChangeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שינוי סטטוס ליד</DialogTitle>
            <DialogDescription>
              שנה את הסטטוס של {statusChangeTarget?.firstName} {statusChangeTarget?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                סטטוס נוכחי:{' '}
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    statusChangeTarget && STATUS_CONFIG[statusChangeTarget.leadStatus]?.color
                  )}
                >
                  {statusChangeTarget && STATUS_CONFIG[statusChangeTarget.leadStatus]?.label}
                </Badge>
              </p>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val as LeadStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס חדש" />
                </SelectTrigger>
                <SelectContent>
                  {statusChangeTarget &&
                    VALID_TRANSITIONS[statusChangeTarget.leadStatus].map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeTarget(null)}>
              ביטול
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || statusChangeMutation.isPending}
            >
              {statusChangeMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              עדכן סטטוס
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={!!convertTarget} onOpenChange={() => {
        setConvertTarget(null);
        setSelectedPlanId('none');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>המרת ליד ללקוח</DialogTitle>
            <DialogDescription>
              המרת {convertTarget?.firstName} {convertTarget?.lastName} ללקוח פעיל במערכת.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Lead info summary */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{convertTarget?.firstName} {convertTarget?.lastName}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    convertTarget && STATUS_CONFIG[convertTarget.leadStatus]?.color
                  )}
                >
                  {convertTarget && STATUS_CONFIG[convertTarget.leadStatus]?.label}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {convertTarget?.email}
                </span>
                {convertTarget?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {convertTarget.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Membership plan selection */}
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
              setConvertTarget(null);
              setSelectedPlanId('none');
            }}>
              ביטול
            </Button>
            <Button onClick={handleConvert} disabled={convertMutation.isPending}>
              {convertMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              <UserCheck className="ml-2 h-4 w-4" />
              המר ללקוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversion Success Dialog */}
      <Dialog open={!!convertSuccess} onOpenChange={() => setConvertSuccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <UserCheck className="h-5 w-5" />
              הליד הומר בהצלחה!
            </DialogTitle>
            <DialogDescription>
              {convertSuccess?.firstName} {convertSuccess?.lastName} הוא כעת לקוח פעיל במערכת.
              {selectedPlanId !== 'none' && ' מנוי פעיל הוקצה ללקוח.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setConvertSuccess(null)}>
              חזור לרשימת הלידים
            </Button>
            <Button onClick={() => {
              if (convertSuccess) {
                router.push(`/dashboard/customers/${convertSuccess.id}`);
              }
            }}>
              <Eye className="ml-2 h-4 w-4" />
              עבור לפרופיל הלקוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
