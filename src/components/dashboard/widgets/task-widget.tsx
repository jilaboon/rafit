'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckSquare,
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeName: string | null;
}

interface TaskStats {
  overdueCount: number;
  dueTodayCount: number;
  inProgressCount: number;
  myPendingCount: number;
}

const priorityDotColor: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-gray-400',
};

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

function isDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  const today = new Date();
  const due = new Date(task.dueDate);
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  );
}

export function TaskWidget() {
  const { data: stats } = useQuery<TaskStats>({
    queryKey: ['taskStats'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: tasksData, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ['taskWidgetTasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks?limit=5&status=PENDING,IN_PROGRESS');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
  });

  const tasks = tasksData?.tasks ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <CheckSquare className="h-5 w-5" />
          משימות
        </CardTitle>
        <Link
          href="/dashboard/tasks"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          צפה בכל המשימות
          <ArrowLeft className="mr-1 inline h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {/* Stats row */}
        {stats && (
          <div className="mb-4 flex gap-3">
            {stats.overdueCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.overdueCount} באיחור
              </Badge>
            )}
            {stats.dueTodayCount > 0 && (
              <Badge className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                <Calendar className="h-3 w-3" />
                {stats.dueTodayCount} להיום
              </Badge>
            )}
            {stats.inProgressCount > 0 && (
              <Badge className="gap-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                <Clock className="h-3 w-3" />
                {stats.inProgressCount} בתהליך
              </Badge>
            )}
          </div>
        )}

        {/* Task list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            אין משימות פתוחות
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const overdue = isOverdue(task);
              const dueToday = isDueToday(task);

              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border px-3 py-2 text-sm',
                    overdue && 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20'
                  )}
                >
                  <div
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      priorityDotColor[task.priority] || 'bg-gray-400'
                    )}
                  />
                  <span className="flex-1 truncate font-medium">{task.title}</span>
                  {task.dueDate && (
                    <span
                      className={cn(
                        'shrink-0 text-xs text-muted-foreground',
                        overdue && 'font-medium text-red-600',
                        dueToday && !overdue && 'font-medium text-amber-600'
                      )}
                    >
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
