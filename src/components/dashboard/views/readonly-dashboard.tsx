'use client';

import {
  DashboardStatsWidget,
  TodayClassesWidget,
  RecentActivityWidget,
} from '../widgets';

export function ReadOnlyDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-muted-foreground">סקירה כללית</p>
      </div>

      {/* Stats Overview - Read only */}
      <DashboardStatsWidget />

      {/* Today's Classes - View only */}
      <TodayClassesWidget limit={5} showViewAll={false} />

      {/* Recent Activity - Limited view */}
      <RecentActivityWidget limit={5} showViewAll={false} />
    </div>
  );
}
