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
    if (action.includes('delete')) return 'text-red-400 border-red-500/30';
    if (action.includes('create')) return 'text-green-400 border-green-500/30';
    if (action.includes('update')) return 'text-blue-400 border-blue-500/30';
    if (action.includes('login')) return 'text-purple-400 border-purple-500/30';
    if (action.includes('impersonate')) return 'text-yellow-400 border-yellow-500/30';
    return 'text-slate-400 border-slate-500/30';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-slate-400 mt-1">
          Monitor all platform activity and audit events
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Filter by action (e.g., user.login)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800"
          />
        </div>
      </form>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-900/50">
                  <TableHead className="text-slate-400">Time</TableHead>
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                  <TableHead className="text-slate-400">Entity</TableHead>
                  <TableHead className="text-slate-400">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-slate-800 hover:bg-slate-900/50"
                  >
                    <TableCell className="text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-white">
                      {log.user ? (
                        <div>
                          <p className="font-medium">{log.user.name}</p>
                          <p className="text-xs text-slate-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">System</span>
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
                    <TableCell className="text-slate-400">
                      {log.entityType ? (
                        <div>
                          <span className="capitalize">{log.entityType}</span>
                          {log.entityId && (
                            <span className="text-slate-500 text-xs ml-1">
                              ({log.entityId.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">
                      {log.ipAddress || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-slate-500 py-8"
                    >
                      No activity logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {pagination && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {logs.length} of {pagination.total} entries
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
