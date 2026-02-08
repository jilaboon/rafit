'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { TenantTable } from '@/components/admin/tenant-table';
import { CreateTenantDialog } from '@/components/admin/create-tenant-dialog';
import { Search } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  status: string;
  createdAt: string;
  _count: {
    tenantUsers: number;
    branches: number;
  };
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function TenantsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeSearch, setActiveSearch] = useState(searchParams.get('search') || '');

  const { data, isLoading } = useQuery<{ tenants: Tenant[]; pagination: PaginationInfo }>({
    queryKey: ['admin-tenants', { search: activeSearch }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSearch) params.set('search', activeSearch);
      const response = await fetch(`/api/admin/tenants?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return { tenants: result.tenants, pagination: result.pagination };
    },
  });

  const tenants = data?.tenants || [];
  const pagination = data?.pagination || null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(search);
    router.push(`/admin/tenants?search=${encodeURIComponent(search)}`);
  };

  const handleDelete = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">עסקים</h1>
          <p className="text-muted-foreground mt-1">
            ניהול כל העסקים בפלטפורמה
          </p>
        </div>
        <CreateTenantDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })} />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש עסקים..."
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
          <TenantTable tenants={tenants} onDelete={handleDelete} />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                מציג {tenants.length} מתוך {pagination.total} עסקים
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
