'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async (action: string = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);

      const response = await fetch(`/api/admin/activity?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(actionFilter);
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-600 border-red-500/30';
    if (action.includes('create')) return 'text-green-600 border-green-500/30';
    if (action.includes('update')) return 'text-blue-600 border-blue-500/30';
    if (action.includes('login')) return 'text-purple-600 border-purple-500/30';
    if (action.includes('impersonate')) return 'text-yellow-600 border-yellow-500/30';
    return 'text-muted-foreground border-gray-500/30';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">יומן פעילות</h1>
        <p className="text-muted-foreground mt-1">
          ניטור כל הפעילות והאירועים בפלטפורמה
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="סינון לפי פעולה (לדוגמה: user.login)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pr-10"
          />
        </div>
      </form>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">זמן</TableHead>
                  <TableHead className="text-right">משתמש</TableHead>
                  <TableHead className="text-right">פעולה</TableHead>
                  <TableHead className="text-right">ישות</TableHead>
                  <TableHead className="text-right">כתובת IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('he-IL')}
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <p className="font-medium">{log.user.name}</p>
                          <p className="text-xs text-muted-foreground">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">מערכת</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getActionColor(log.action)}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.entityType ? (
                        <div>
                          <span className="capitalize">{log.entityType}</span>
                          {log.entityId && (
                            <span className="text-muted-foreground text-xs mr-1">
                              ({log.entityId.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {log.ipAddress || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      לא נמצאו רשומות פעילות
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {pagination && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                מציג {logs.length} מתוך {pagination.total} רשומות
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
