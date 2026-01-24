'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassInstance {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  coachName?: string;
  roomName?: string;
  isCancelled: boolean;
}

interface TodayClassesWidgetProps {
  limit?: number;
  showViewAll?: boolean;
  compact?: boolean;
}

export function TodayClassesWidget({
  limit = 5,
  showViewAll = true,
  compact = false,
}: TodayClassesWidgetProps) {
  const [classes, setClasses] = useState<ClassInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const response = await fetch(`/api/dashboard/today-classes?limit=${limit}`);
        const data = await response.json();
        if (response.ok) {
          setClasses(data.classes);
        }
      } catch (error) {
        console.error('Failed to fetch today classes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClasses();
  }, [limit]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          שיעורים היום
        </CardTitle>
        {showViewAll && (
          <Link href="/dashboard/schedule">
            <Button variant="ghost" size="sm">
              הצג הכל
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
            אין שיעורים מתוכננים להיום
          </p>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  cls.isCancelled && 'opacity-50 bg-muted'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{cls.name}</p>
                    {cls.isCancelled && (
                      <Badge variant="destructive" className="text-xs">
                        בוטל
                      </Badge>
                    )}
                  </div>
                  {!compact && (
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                      </span>
                      {cls.coachName && (
                        <span>{cls.coachName}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={cls.bookedCount >= cls.capacity ? 'destructive' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    <Users className="h-3 w-3" />
                    {cls.bookedCount}/{cls.capacity}
                  </Badge>
                  {cls.waitlistCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{cls.waitlistCount} המתנה
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
