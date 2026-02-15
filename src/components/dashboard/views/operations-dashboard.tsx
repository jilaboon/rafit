'use client';

import {
  DashboardStatsWidget,
  TodayClassesWidget,
  CheckinWidget,
  QuickActionsWidget,
  RecentActivityWidget,
  TaskWidget,
} from '../widgets';

export function OperationsDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">לוח בקרה תפעולי</h1>
        <p className="text-muted-foreground">ניהול השיעורים והצ'ק-אין היומי</p>
      </div>

      {/* Quick Actions - Most important for operations */}
      <QuickActionsWidget />

      {/* Stats Overview */}
      <DashboardStatsWidget />

      {/* Tasks */}
      <TaskWidget />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Check-ins - Critical for front desk */}
        <CheckinWidget />

        {/* Today's Classes */}
        <TodayClassesWidget limit={8} showViewAll />
      </div>

      {/* Recent Activity */}
      <RecentActivityWidget limit={8} />
    </div>
  );
}
