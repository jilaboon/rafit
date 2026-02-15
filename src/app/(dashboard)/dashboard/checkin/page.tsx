'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Check, Clock, Users, UserCheck, AlertCircle, AlertTriangle, Cake, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials, formatTime } from '@/lib/utils';
import { useBranch } from '@/components/providers/branch-provider';

interface ClassInfo {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  room?: string;
  coach?: string;
  bookings: {
    total: number;
    checkedIn: number;
    pending: number;
  };
}

interface Attendee {
  id: string;
  bookingId: string;
  name: string;
  email: string;
  phone?: string;
  membershipType: string;
  checkedIn: boolean;
  checkedInAt?: string;
  isBirthday?: boolean;
  medicalNotes?: string | null;
}

export default function CheckinPage() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMedical, setExpandedMedical] = useState<Set<string>>(new Set());
  const { selectedBranchId } = useBranch();

  // Fetch today's classes
  const { data: classesData, isLoading } = useQuery<{ classes: ClassInfo[] }>({
    queryKey: ['checkin-classes', { branchId: selectedBranchId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBranchId) params.set('branchId', selectedBranchId);
      const url = params.toString() ? `/api/classes/today?${params}` : '/api/classes/today';
      const response = await fetch(url);
      const data = await response.json();
      if (data.classes?.length > 0 && !selectedClassId) {
        const now = new Date();
        const classWithPending = data.classes.find(
          (c: ClassInfo) => c.bookings.pending > 0 && new Date(c.startTime) <= now
        );
        setSelectedClassId(classWithPending?.id || data.classes[0].id);
      }
      return data;
    },
  });

  const classes = classesData?.classes || [];

  // Fetch attendees when class is selected
  const { data: currentClass, isLoading: isLoadingAttendees } = useQuery<{
    class: ClassInfo;
    attendees: Attendee[];
    stats: { total: number; checkedIn: number; pending: number };
  }>({
    queryKey: ['checkin-bookings', { classId: selectedClassId }],
    queryFn: async () => {
      const response = await fetch(`/api/classes/${selectedClassId}/attendees`);
      const data = await response.json();
      return {
        class: data.class,
        attendees: data.attendees,
        stats: data.stats,
      };
    },
    enabled: !!selectedClassId,
  });

  const checkinMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'שגיאה בצ\'ק-אין');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-bookings', { classId: selectedClassId }] });
      queryClient.invalidateQueries({ queryKey: ['checkin-classes'] });
    },
    onError: (err: Error) => {
      alert(err.message || 'שגיאה בצ\'ק-אין');
    },
  });

  const handleCheckin = (bookingId: string) => {
    checkinMutation.mutate(bookingId);
  };

  const checkingIn = checkinMutation.isPending ? checkinMutation.variables : null;

  const filteredAttendees = currentClass?.attendees.filter(
    (a) =>
      a.name.includes(searchQuery) ||
      a.email.includes(searchQuery) ||
      (a.phone && a.phone.includes(searchQuery))
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">צ&apos;ק-אין</h1>
          <p className="text-muted-foreground">סימון נוכחות למשתתפים</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">אין שיעורים היום</p>
            <p className="text-sm text-muted-foreground">
              לא נמצאו שיעורים מתוכננים להיום
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with class selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">צ&apos;ק-אין</h1>
          <p className="text-muted-foreground">סימון נוכחות למשתתפים</p>
        </div>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="בחר שיעור" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                <span className="flex items-center gap-2">
                  {cls.name} - {formatTime(new Date(cls.startTime))}
                  {cls.bookings.pending > 0 && (
                    <span className="rounded bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
                      {cls.bookings.pending}
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoadingAttendees ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : currentClass ? (
        <>
          {/* Current Class Header */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{currentClass.class.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-primary-foreground/80">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(new Date(currentClass.class.startTime))} -{' '}
                      {formatTime(new Date(currentClass.class.endTime))}
                    </span>
                    {currentClass.class.coach && (
                      <span>מדריך: {currentClass.class.coach}</span>
                    )}
                    {currentClass.class.room && (
                      <span>אולם: {currentClass.class.room}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{currentClass.stats.checkedIn}</p>
                    <p className="text-sm text-primary-foreground/80">נכחו</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{currentClass.stats.pending}</p>
                    <p className="text-sm text-primary-foreground/80">ממתינים</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{currentClass.class.capacity}</p>
                    <p className="text-sm text-primary-foreground/80">קיבולת</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-success/10 p-2">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{currentClass.stats.checkedIn}</p>
                  <p className="text-sm text-muted-foreground">עשו צ&apos;ק-אין</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{currentClass.stats.pending}</p>
                  <p className="text-sm text-muted-foreground">ממתינים</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round((currentClass.stats.checkedIn / currentClass.class.capacity) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">תפוסה</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="חפש לפי שם, אימייל או טלפון..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attendees List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">רשימת משתתפים</CardTitle>
              <CardDescription>לחץ על צ&apos;ק-אין לסימון נוכחות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredAttendees.length === 0 ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium">
                      {currentClass.attendees.length === 0
                        ? 'אין נרשמים לשיעור זה'
                        : 'לא נמצאו משתתפים'}
                    </p>
                  </div>
                ) : (
                  filteredAttendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className={cn(
                        'rounded-lg border p-4 transition-colors',
                        attendee.checkedIn
                          ? 'border-success/50 bg-success/5'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback
                              className={cn(
                                attendee.checkedIn ? 'bg-success text-success-foreground' : ''
                              )}
                            >
                              {attendee.checkedIn ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                getInitials(attendee.name)
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{attendee.name}</p>
                              {attendee.isBirthday && (
                                <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                                  <Cake className="ml-1 h-3 w-3" />
                                  יום הולדת!
                                </Badge>
                              )}
                              {attendee.medicalNotes && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedMedical((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(attendee.id)) {
                                        next.delete(attendee.id);
                                      } else {
                                        next.add(attendee.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                                  title="הערות רפואיות"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  הגבלה רפואית
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {attendee.membershipType}
                            </p>
                            {attendee.checkedIn && attendee.checkedInAt && (
                              <p className="text-xs text-success">
                                נכנס ב-{formatTime(new Date(attendee.checkedInAt))}
                              </p>
                            )}
                          </div>
                        </div>

                        {attendee.checkedIn ? (
                          <span className="flex items-center gap-2 text-sm text-success">
                            <Check className="h-4 w-4" />
                            נכח
                          </span>
                        ) : (
                          <Button
                            variant="default"
                            size="lg"
                            onClick={() => handleCheckin(attendee.bookingId)}
                            disabled={checkingIn === attendee.bookingId}
                          >
                            {checkingIn === attendee.bookingId ? (
                              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                            ) : (
                              <Check className="ml-2 h-5 w-5" />
                            )}
                            צ&apos;ק-אין
                          </Button>
                        )}
                      </div>

                      {/* Expanded medical notes */}
                      {attendee.medicalNotes && expandedMedical.has(attendee.id) && (
                        <div className="mt-3 mr-16 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{attendee.medicalNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
