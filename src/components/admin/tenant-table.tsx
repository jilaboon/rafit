'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface TenantTableProps {
  tenants: Tenant[];
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  SUSPENDED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function TenantTable({ tenants, onDelete }: TenantTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      });
      if (response.ok && onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-slate-900/50">
            <TableHead className="text-slate-400">Name</TableHead>
            <TableHead className="text-slate-400">Slug</TableHead>
            <TableHead className="text-slate-400">Status</TableHead>
            <TableHead className="text-slate-400">Users</TableHead>
            <TableHead className="text-slate-400">Branches</TableHead>
            <TableHead className="text-slate-400">Created</TableHead>
            <TableHead className="text-slate-400 w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow
              key={tenant.id}
              className="border-slate-800 hover:bg-slate-900/50"
            >
              <TableCell className="font-medium text-white">
                {tenant.name}
              </TableCell>
              <TableCell className="text-slate-400">{tenant.slug}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('capitalize', statusColors[tenant.status])}
                >
                  {tenant.status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-300">
                {tenant._count.tenantUsers}
              </TableCell>
              <TableCell className="text-slate-300">
                {tenant._count.branches}
              </TableCell>
              <TableCell className="text-slate-400">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/tenants/${tenant.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/tenants/${tenant.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(tenant.id)}
                      disabled={deletingId === tenant.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === tenant.id ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {tenants.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-slate-500 py-8"
              >
                No tenants found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
