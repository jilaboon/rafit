'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  Calendar,
  Loader2,
  Circle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Search,
  User,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

// Types
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdById: string;
  createdByName: string | null;
  entityType: string | null;
  entityId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskStats {
  overdueCount: number;
  dueTodayCount: number;
  inProgressCount: number;
  myPendingCount: number;
}

interface StaffMember {
  id: string;
  tenantUserId: string;
  name: string;
  role: string;
}

const statusLabels: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  PENDING: { label: 'ממתין', color: 'bg-muted text-muted-foreground', icon: Circle },
  IN_PROGRESS: { label: 'בתהליך', color: 'bg-blue-500/10 text-blue-600', icon: Clock },
  COMPLETED: { label: 'הושלם', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 },
  CANCELLED: { label: 'בוטל', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const priorityLabels: Record<string, { label: string; color: string; dotColor: string }> = {
  URGENT: { label: 'דחוף', color: 'bg-red-500/10 text-red-600', dotColor: 'bg-red-500' },
  HIGH: { label: 'גבוה', color: 'bg-orange-500/10 text-orange-600', dotColor: 'bg-orange-500' },
  MEDIUM: { label: 'בינוני', color: 'bg-blue-500/10 text-blue-600', dotColor: 'bg-blue-500' },
  LOW: { label: 'נמוך', color: 'bg-gray-500/10 text-gray-600', dotColor: 'bg-gray-400' },
};

const entityTypeLabels: Record<string, string> = {
  customer: 'לקוח',
  booking: 'הזמנה',
  membership: 'מנוי',
  lead: 'ליד',
};

type TabFilter = 'all' | 'mine' | 'pending' | 'in_progress' | 'completed' | 'overdue';

const tabs: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'mine', label: 'שלי' },
  { key: 'pending', label: 'ממתינים' },
  { key: 'in_progress', label: 'בתהליך' },
  { key: 'completed', label: 'הושלמו' },
  { key: 'overdue', label: 'באיחור' },
];

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

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as string,
    dueDate: '',
    assigneeId: '',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query params based on active tab
  const getQueryParams = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);

    switch (activeTab) {
      case 'mine':
        // Handled server-side for restricted roles, but we can pass a marker
        params.set('assigneeId', 'me');
        break;
      case 'pending':
        params.set('status', 'PENDING');
        break;
      case 'in_progress':
        params.set('status', 'IN_PROGRESS');
        break;
      case 'completed':
        params.set('status', 'COMPLETED');
        break;
      case 'overdue':
        params.set('status', 'PENDING,IN_PROGRESS');
        params.set('dueBefore', new Date(new Date().toDateString()).toISOString());
        break;
    }
    return params.toString();
  };

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery<{
    tasks: Task[];
    total: number;
  }>({
    queryKey: ['tasks', activeTab, debouncedSearch],
    queryFn: async () => {
      const params = getQueryParams();
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<TaskStats>({
    queryKey: ['taskStats'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch staff for assignee dropdown
  const { data: staffData } = useQuery<{ users: StaffMember[] }>({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await fetch('/api/tenants/users');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  const tasks = tasksData?.tasks ?? [];
  const staff = staffData?.users ?? [];

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (taskData: typeof newTask) => {
      const body: Record<string, unknown> = {
        title: taskData.title,
        priority: taskData.priority,
      };
      if (taskData.description) body.description = taskData.description;
      if (taskData.dueDate) body.dueDate = taskData.dueDate;
      if (taskData.assigneeId) body.assigneeId = taskData.assigneeId;

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'שגיאה ביצירת משימה');
      return data;
    },
    onSuccess: () => {
      setShowNewDialog(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'שגיאה בעדכון משימה');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'שגיאה בביטול משימה');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;
    createMutation.mutate(newTask);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">משימות</h1>
          <p className="text-muted-foreground">ניהול משימות ותזכורות</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="ml-2 h-4 w-4" />
          משימה חדשה
        </Button>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-red-500/10 p-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdueCount}</p>
                <p className="text-sm text-muted-foreground">באיחור</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.dueTodayCount}</p>
                <p className="text-sm text-muted-foreground">להיום</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgressCount}</p>
                <p className="text-sm text-muted-foreground">בתהליך</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.myPendingCount}</p>
                <p className="text-sm text-muted-foreground">ממתינים שלי</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs + Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {tab.key === 'overdue' && stats && stats.overdueCount > 0 && (
                    <Badge variant="destructive" className="mr-2 h-5 w-5 rounded-full p-0 text-[10px]">
                      {stats.overdueCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי כותרת..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">רשימת משימות</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center">
              <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">
                {debouncedSearch ? 'לא נמצאו משימות' : 'אין משימות'}
              </p>
              <p className="text-sm text-muted-foreground">
                {debouncedSearch ? 'נסה לחפש במונחים אחרים' : 'צור את המשימה הראשונה שלך'}
              </p>
              {!debouncedSearch && (
                <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                  <Plus className="ml-2 h-4 w-4" />
                  משימה חדשה
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const statusInfo = statusLabels[task.status];
                const priorityInfo = priorityLabels[task.priority];
                const overdue = isOverdue(task);
                const dueToday = isDueToday(task);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50',
                      overdue && 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20'
                    )}
                  >
                    {/* Priority dot */}
                    <div className="mt-1.5 flex flex-col items-center gap-2">
                      <div className={cn('h-2.5 w-2.5 rounded-full', priorityInfo.dotColor)} />
                    </div>

                    {/* Task content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.title}</span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', statusInfo.color)}
                        >
                          <StatusIcon className="ml-1 h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', priorityInfo.color)}
                        >
                          {priorityInfo.label}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {task.assigneeName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigneeName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span
                            className={cn(
                              'flex items-center gap-1',
                              overdue && 'font-medium text-red-600',
                              dueToday && !overdue && 'font-medium text-amber-600'
                            )}
                          >
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                            {overdue && ' (באיחור)'}
                            {dueToday && !overdue && ' (היום)'}
                          </span>
                        )}
                        {task.entityType && (
                          <span className="flex items-center gap-1">
                            {entityTypeLabels[task.entityType] || task.entityType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2">
                      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: task.id,
                              status: 'COMPLETED',
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {task.status === 'PENDING' && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: task.id,
                                  status: 'IN_PROGRESS',
                                })
                              }
                            >
                              <Clock className="ml-2 h-4 w-4" />
                              התחל עבודה
                            </DropdownMenuItem>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: task.id,
                                  status: 'COMPLETED',
                                })
                              }
                            >
                              <CheckCircle2 className="ml-2 h-4 w-4" />
                              סמן כהושלם
                            </DropdownMenuItem>
                          )}
                          {task.status === 'COMPLETED' && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: task.id,
                                  status: 'PENDING',
                                })
                              }
                            >
                              <Circle className="ml-2 h-4 w-4" />
                              פתח מחדש
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(task.id)}
                          >
                            <XCircle className="ml-2 h-4 w-4" />
                            ביטול
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Task Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>משימה חדשה</DialogTitle>
            <DialogDescription>צור משימה חדשה ושייך אותה לאיש צוות</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">כותרת *</Label>
              <Input
                id="task-title"
                placeholder="כותרת המשימה"
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">תיאור</Label>
              <Textarea
                id="task-description"
                placeholder="תיאור המשימה"
                rows={3}
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>עדיפות</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">נמוך</SelectItem>
                    <SelectItem value="MEDIUM">בינוני</SelectItem>
                    <SelectItem value="HIGH">גבוה</SelectItem>
                    <SelectItem value="URGENT">דחוף</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-due-date">תאריך יעד</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>שיוך לאיש צוות</Label>
              <Select
                value={newTask.assigneeId}
                onValueChange={(value) =>
                  setNewTask((prev) => ({ ...prev, assigneeId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר איש צוות" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.tenantUserId} value={member.tenantUserId}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={createMutation.isPending || !newTask.title.trim()}
            >
              {createMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              צור משימה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
