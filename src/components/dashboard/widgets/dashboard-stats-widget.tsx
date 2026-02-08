'use client';

import { useQuery } from '@tanstack/react-query';
import { StatsCard, StatsGrid } from './stats-card';
import { Calendar, Users, CreditCard, TrendingUp } from 'lucide-react';

interface DashboardStats {
  classesToday: number;
  bookingsToday: number;
  revenueMonth: number;
  activeMembers: number;
  classesChange?: number;
  bookingsChange?: number;
  revenueChange?: number;
  membersChange?: number;
}

export function DashboardStatsWidget() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [classesRes, revenueRes] = await Promise.all([
        fetch('/api/dashboard/today-classes'),
        fetch('/api/dashboard/revenue?period=month'),
      ]);

      if (!classesRes.ok || !revenueRes.ok) throw new Error('Failed to fetch dashboard stats');

      const classesData = await classesRes.json();
      const revenueData = await revenueRes.json();

      return {
        classesToday: classesData.summary?.totalClasses || 0,
        bookingsToday: classesData.summary?.totalBookings || 0,
        revenueMonth: revenueData.current?.amount || 0,
        activeMembers: revenueData.memberships?.new || 0,
        revenueChange: revenueData.percentageChange || 0,
      };
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <StatsGrid columns={4}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-lg border bg-muted/50 animate-pulse"
          />
        ))}
      </StatsGrid>
    );
  }

  return (
    <StatsGrid columns={4}>
      <StatsCard
        title="שיעורים היום"
        value={stats?.classesToday || 0}
        icon={Calendar}
      />
      <StatsCard
        title="הזמנות היום"
        value={stats?.bookingsToday || 0}
        icon={Users}
      />
      <StatsCard
        title="הכנסות החודש"
        value={formatCurrency(stats?.revenueMonth || 0)}
        icon={CreditCard}
        trend={
          stats?.revenueChange
            ? {
                value: stats.revenueChange,
                isPositive: stats.revenueChange >= 0,
              }
            : undefined
        }
      />
      <StatsCard
        title="מנויים חדשים"
        value={stats?.activeMembers || 0}
        subtitle="החודש"
        icon={TrendingUp}
      />
    </StatsGrid>
  );
}
