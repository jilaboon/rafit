'use client';

import {
  MyClassesWidget,
  TodayClassesWidget,
  RecentActivityWidget,
} from '../widgets';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Clock } from 'lucide-react';

export function CoachDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-muted-foreground">השיעורים שלי השבוע</p>
      </div>

      {/* Coach-specific Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">שיעורים השבוע</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-secondary/10 p-3">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">סה"כ מתאמנים</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">שעות הדרכה</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Upcoming Classes - Primary focus */}
      <MyClassesWidget daysAhead={7} />

      {/* Today's Schedule Overview */}
      <TodayClassesWidget limit={10} />

      {/* Recent Activity - Limited view */}
      <RecentActivityWidget limit={5} />
    </div>
  );
}
