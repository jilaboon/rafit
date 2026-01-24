'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  action: string;
  entityType?: string;
  description: string;
  userName?: string;
  createdAt: string;
}

interface RecentActivityWidgetProps {
  limit?: number;
  showViewAll?: boolean;
}

const actionLabels: Record<string, string> = {
  'booking.create': 'הזמנה חדשה',
  'booking.cancel': 'ביטול הזמנה',
  'booking.checkin': 'צ\'ק-אין',
  'customer.create': 'לקוח חדש',
  'membership.create': 'מנוי חדש',
  'payment.create': 'תשלום',
  'user.login': 'התחברות',
};

const actionColors: Record<string, string> = {
  'booking.create': 'bg-blue-500/20 text-blue-600',
  'booking.cancel': 'bg-red-500/20 text-red-600',
  'booking.checkin': 'bg-green-500/20 text-green-600',
  'customer.create': 'bg-purple-500/20 text-purple-600',
  'membership.create': 'bg-yellow-500/20 text-yellow-600',
  'payment.create': 'bg-emerald-500/20 text-emerald-600',
};

export function RecentActivityWidget({
  limit = 10,
  showViewAll = true,
}: RecentActivityWidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch(`/api/dashboard/recent-activity?limit=${limit}`);
        const data = await response.json();
        if (response.ok) {
          setActivities(data.activities);
        }
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivity();
  }, [limit]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'עכשיו';
    if (minutes < 60) return `לפני ${minutes} דקות`;
    if (hours < 24) return `לפני ${hours} שעות`;
    return date.toLocaleDateString('he-IL');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          פעילות אחרונה
        </CardTitle>
        {showViewAll && (
          <Link href="/dashboard/activity">
            <Button variant="ghost" size="sm">
              הכל
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
        ) : activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            אין פעילות אחרונה
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    'mt-0.5 shrink-0',
                    actionColors[activity.action] || 'bg-gray-500/20 text-gray-600'
                  )}
                >
                  {actionLabels[activity.action] || activity.action}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {activity.userName && (
                      <span className="text-xs text-muted-foreground">
                        {activity.userName}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
