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
  ACTIVE: 'bg-green-500/20 text-green-600 border-green-500/30',
  INACTIVE: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
  SUSPENDED: 'bg-red-500/20 text-red-600 border-red-500/30',
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
        <p className="text-muted-foreground mt-1">
          צפייה וניהול כל המשתמשים בפלטפורמה
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש משתמשים..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">עסקים</TableHead>
                  <TableHead className="text-right">נוצר</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.name}
                        {user.isSuperAdmin && (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', statusColors[user.status])}
                      >
                        {user.status === 'ACTIVE' ? 'פעיל' : user.status === 'INACTIVE' ? 'לא פעיל' : 'מושהה'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.tenantUsers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.tenantUsers.slice(0, 2).map((tu) => (
                            <Badge
                              key={tu.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {tu.tenant.name}
                            </Badge>
                          ))}
                          {user.tenantUsers.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              +{user.tenantUsers.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('he-IL')}
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
                      className="text-center text-muted-foreground py-8"
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
              <p className="text-sm text-muted-foreground">
                מציג {users.length} מתוך {pagination.total} משתמשים
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
