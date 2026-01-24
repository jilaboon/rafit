'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Users,
  Clock,
  MapPin,
  Filter,
  List,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data - will be replaced with real API data
const mockClasses = [
  {
    id: '1',
    name: 'יוגה בוקר',
    startTime: new Date(2024, 0, 15, 7, 0),
    endTime: new Date(2024, 0, 15, 8, 0),
    coach: 'דנה שמש',
    room: 'אולם יוגה',
    booked: 12,
    capacity: 20,
    color: '#8b5cf6',
  },
  {
    id: '2',
    name: 'פילאטיס',
    startTime: new Date(2024, 0, 15, 9, 0),
    endTime: new Date(2024, 0, 15, 9, 55),
    coach: 'מיכל כהן',
    room: 'אולם כושר',
    booked: 15,
    capacity: 15,
    color: '#ec4899',
  },
  {
    id: '3',
    name: 'HIIT',
    startTime: new Date(2024, 0, 15, 10, 30),
    endTime: new Date(2024, 0, 15, 11, 15),
    coach: 'יואב שמש',
    room: 'אולם כושר',
    booked: 8,
    capacity: 15,
    color: '#ef4444',
  },
  {
    id: '4',
    name: 'יוגה ערב',
    startTime: new Date(2024, 0, 15, 18, 0),
    endTime: new Date(2024, 0, 15, 19, 0),
    coach: 'דנה שמש',
    room: 'אולם יוגה',
    booked: 10,
    capacity: 20,
    color: '#8b5cf6',
  },
];

type ViewMode = 'day' | 'week' | 'list';

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousDay = () => setSelectedDate((d) => addDays(d, -1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  const filteredClasses = mockClasses.filter((cls) =>
    isSameDay(cls.startTime, selectedDate)
  );

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

            {/* View Mode & Filters */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
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
                  style={{ backgroundColor: cls.color }}
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
                            cls.booked >= cls.capacity
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-success/10 text-success'
                          )}
                        >
                          {cls.booked >= cls.capacity ? 'מלא' : 'מקומות פנויים'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(cls.startTime, 'HH:mm')} - {format(cls.endTime, 'HH:mm')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {cls.booked}/{cls.capacity}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {cls.room}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        מדריך: {cls.coach}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/dashboard/schedule/${cls.id}/attendees`}>
                        <Button variant="outline" size="sm">
                          <Users className="ml-2 h-4 w-4" />
                          נרשמו ({cls.booked})
                        </Button>
                      </Link>
                      <Link href={`/dashboard/schedule/${cls.id}`}>
                        <Button variant="outline" size="sm">
                          עריכה
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

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
              {filteredClasses.reduce((sum, c) => sum + c.booked, 0)}
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
              {filteredClasses.reduce((sum, c) => sum + (c.capacity - c.booked), 0)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
