'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const fetchTenants = async (searchQuery: string = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/admin/tenants?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTenants(data.tenants);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants(search);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTenants(search);
    router.push(`/admin/tenants?search=${encodeURIComponent(search)}`);
  };

  const handleDelete = (id: string) => {
    setTenants(tenants.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">עסקים</h1>
          <p className="text-slate-400 mt-1">
            ניהול כל העסקים בפלטפורמה
          </p>
        </div>
        <CreateTenantDialog onSuccess={() => fetchTenants(search)} />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="חיפוש עסקים..."
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
          <TenantTable tenants={tenants} onDelete={handleDelete} />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                מציג {tenants.length} מתוך {pagination.total} עסקים
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
