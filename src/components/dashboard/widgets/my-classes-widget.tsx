'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, MapPin, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MyClass {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  roomName?: string;
  branchName?: string;
  isCancelled: boolean;
}

interface MyClassesWidgetProps {
  limit?: number;
  showViewAll?: boolean;
  daysAhead?: number;
}

export function MyClassesWidget({
  limit = 5,
  showViewAll = true,
  daysAhead = 7,
}: MyClassesWidgetProps) {
  const { data, isLoading } = useQuery<{ classes: MyClass[] }>({
    queryKey: ['dashboard-my-classes', limit, daysAhead],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/my-classes?limit=${limit}&days=${daysAhead}`);
      if (!response.ok) throw new Error('Failed to fetch my classes');
      return response.json();
    },
  });

  const classes = data?.classes ?? [];

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'היום';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'מחר';
    }
    return date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const isNow = (startTime: string, endTime: string) => {
    const now = new Date();
    return now >= new Date(startTime) && now <= new Date(endTime);
  };

  const isUpcoming = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();
    return diff > 0 && diff < 60 * 60 * 1000; // Within 1 hour
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          השיעורים שלי
        </CardTitle>
        {showViewAll && (
          <Link href="/dashboard/schedule?view=my">
            <Button variant="ghost" size="sm">
              לוח זמנים מלא
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : classes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            אין לך שיעורים קרובים
          </p>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => {
              const nowPlaying = isNow(cls.startTime, cls.endTime);
              const upcoming = isUpcoming(cls.startTime);

              return (
                <Link
                  key={cls.id}
                  href={`/dashboard/schedule/class/${cls.id}`}
                  className={cn(
                    'block p-3 rounded-lg border transition-colors hover:bg-muted/50',
                    nowPlaying && 'border-green-500 bg-green-50 dark:bg-green-950/20',
                    upcoming && !nowPlaying && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
                    cls.isCancelled && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{cls.name}</p>
                        {nowPlaying && (
                          <Badge className="bg-green-500">עכשיו</Badge>
                        )}
                        {upcoming && !nowPlaying && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            בקרוב
                          </Badge>
                        )}
                        {cls.isCancelled && (
                          <Badge variant="destructive">בוטל</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="font-medium">{formatDate(cls.startTime)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                        </span>
                      </div>
                      {cls.roomName && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {cls.roomName}
                          {cls.branchName && ` · ${cls.branchName}`}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {cls.bookedCount}/{cls.capacity}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
