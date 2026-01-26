'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ImpersonateButton } from '@/components/admin/impersonate-button';
import { Search, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  status: string;
  isSuperAdmin: boolean;
  createdAt: string;
  tenantUsers: {
    id: string;
    role: string;
    isActive: boolean;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  INACTIVE: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const fetchUsers = async (searchQuery: string = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(search);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
    router.push(`/admin/users?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">משתמשים</h1>
        <p className="text-slate-400 mt-1">
          צפייה וניהול כל המשתמשים בפלטפורמה
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="חיפוש משתמשים..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-slate-900 border-slate-800"
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
                  <TableHead className="text-slate-400 text-right">שם</TableHead>
                  <TableHead className="text-slate-400 text-right">אימייל</TableHead>
                  <TableHead className="text-slate-400 text-right">סטטוס</TableHead>
                  <TableHead className="text-slate-400 text-right">עסקים</TableHead>
                  <TableHead className="text-slate-400 text-right">נוצר</TableHead>
                  <TableHead className="text-slate-400 w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-slate-800 hover:bg-slate-900/50"
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        {user.name}
                        {user.isSuperAdmin && (
                          <Shield className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', statusColors[user.status])}
                      >
                        {user.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {user.tenantUsers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.tenantUsers.slice(0, 2).map((tu) => (
                            <Badge
                              key={tu.id}
                              variant="outline"
                              className="text-xs text-slate-400"
                            >
                              {tu.tenant.name}
                            </Badge>
                          ))}
                          {user.tenantUsers.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-slate-500"
                            >
                              +{user.tenantUsers.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {!user.isSuperAdmin && (
                        <ImpersonateButton
                          userId={user.id}
                          userName={user.name}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-slate-500 py-8"
                    >
                      לא נמצאו משתמשים
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                מציג {users.length} מתוך {pagination.total} משתמשים
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
