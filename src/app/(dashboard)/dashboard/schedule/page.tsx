'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Users,
  Clock,
  MapPin,
  List,
  Calendar as CalendarIcon,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassInfo {
  id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isCancelled: boolean;
  branch: { id: string; name: string };
  room?: { id: string; name: string };
  coach?: { id: string; name: string; color?: string };
  bookings: {
    total: number;
    confirmed: number;
    waitlisted: number;
    checkedIn: number;
  };
}

type ViewMode = 'day' | 'week' | 'list';

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelClass, setCancelClass] = useState<ClassInfo | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousDay = () => setSelectedDate((d) => addDays(d, -1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/classes?date=${dateStr}`);
      const data = await response.json();
      if (data.classes) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCancelClass = async () => {
    if (!cancelClass) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/classes/${cancelClass.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: 'ביטול ידני' }),
      });

      const data = await response.json();

      if (data.success) {
        setCancelClass(null);
        fetchClasses();
      } else {
        alert(data.error || 'שגיאה בביטול השיעור');
      }
    } catch (error) {
      console.error('Error cancelling class:', error);
      alert('שגיאה בביטול השיעור');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredClasses = classes.filter((cls) => !cls.isCancelled);
  const cancelledClasses = classes.filter((cls) => cls.isCancelled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">לוח זמנים</h1>
          <p className="text-muted-foreground">ניהול שיעורים ואימונים</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/schedule/templates">
            <Button variant="outline">
              <CalendarIcon className="ml-2 h-4 w-4" />
              תבניות
            </Button>
          </Link>
          <Link href="/dashboard/schedule/new">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              שיעור חדש
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Date Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                היום
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="mr-4 text-lg font-semibold">
                {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
              </span>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border p-1">
                <Button
                  variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                >
                  יום
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  שבוע
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Week Days */}
          {viewMode === 'week' && (
            <div className="mt-4 grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'rounded-lg p-2 text-center transition-colors',
                    isSameDay(day, selectedDate)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: he })}
                  </div>
                  <div className="text-lg font-semibold">{format(day, 'd')}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classes List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">אין שיעורים ביום זה</p>
                <p className="text-sm text-muted-foreground">
                  הוסף שיעור חדש או בחר תאריך אחר
                </p>
                <Link href="/dashboard/schedule/new">
                  <Button className="mt-4">
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף שיעור
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredClasses.map((cls) => (
              <Card key={cls.id} className="overflow-hidden">
                <div className="flex">
                  {/* Color Indicator */}
                  <div
                    className="w-2"
                    style={{ backgroundColor: cls.coach?.color || '#8b5cf6' }}
                  />

                  <CardContent className="flex-1 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      {/* Class Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{cls.name}</h3>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              cls.bookings.confirmed >= cls.capacity
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-success/10 text-success'
                            )}
                          >
                            {cls.bookings.confirmed >= cls.capacity
                              ? 'מלא'
                              : 'מקומות פנויים'}
                          </span>
                          {cls.bookings.waitlisted > 0 && (
                            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                              {cls.bookings.waitlisted} בהמתנה
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(cls.startTime), 'HH:mm')} -{' '}
                            {format(new Date(cls.endTime), 'HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {cls.bookings.confirmed}/{cls.capacity}
                          </span>
                          {cls.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {cls.room.name}
                            </span>
                          )}
                        </div>
                        {cls.coach && (
                          <p className="text-sm text-muted-foreground">
                            מדריך: {cls.coach.name}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/dashboard/checkin?class=${cls.id}`}>
                          <Button variant="outline" size="sm">
                            <Users className="ml-2 h-4 w-4" />
                            נרשמו ({cls.bookings.confirmed})
                          </Button>
                        </Link>
                        <Link href={`/dashboard/schedule/${cls.id}`}>
                          <Button variant="outline" size="sm">
                            עריכה
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setCancelClass(cls)}
                        >
                          <X className="ml-2 h-4 w-4" />
                          ביטול
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
          )}

          {/* Cancelled Classes */}
          {cancelledClasses.length > 0 && (
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                  <AlertTriangle className="h-5 w-5" />
                  שיעורים מבוטלים ({cancelledClasses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cancelledClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between rounded-lg border border-dashed p-3"
                    >
                      <div className="flex items-center gap-3">
                        <X className="h-4 w-4 text-destructive" />
                        <span className="line-through">{cls.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(cls.startTime), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סה&quot;כ שיעורים היום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredClasses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סה&quot;כ נרשמו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {filteredClasses.reduce((sum, c) => sum + c.bookings.confirmed, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              מקומות פנויים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {filteredClasses.reduce(
                (sum, c) => sum + (c.capacity - c.bookings.confirmed),
                0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelClass} onOpenChange={() => setCancelClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ביטול שיעור</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך לבטל את {cancelClass?.name}?
              {cancelClass && cancelClass.bookings.confirmed > 0 && (
                <>
                  <br />
                  <span className="text-destructive">
                    {cancelClass.bookings.confirmed} הזמנות יבוטלו אוטומטית.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelClass(null)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelClass}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              בטל שיעור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
