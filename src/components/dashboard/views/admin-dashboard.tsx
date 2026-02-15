'use client';

import {
  DashboardStatsWidget,
  TodayClassesWidget,
  RevenueWidget,
  QuickActionsWidget,
  RecentActivityWidget,
  TeamOverviewWidget,
  PaymentsWidget,
  TaskWidget,
} from '../widgets';

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-muted-foreground">סקירה כללית של הסטודיו</p>
      </div>

      {/* Stats Overview */}
      <DashboardStatsWidget />

      {/* Quick Actions */}
      <QuickActionsWidget />

      {/* Tasks */}
      <TaskWidget />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Classes */}
        <TodayClassesWidget limit={5} />

        {/* Revenue Overview */}
        <RevenueWidget />
      </div>

      {/* Secondary Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivityWidget limit={10} />
        </div>

        {/* Team Overview */}
        <TeamOverviewWidget limit={5} />
      </div>

      {/* Payments */}
      <PaymentsWidget limit={5} />
    </div>
  );
}
