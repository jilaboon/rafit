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
  ACTIVE: 'bg-green-500/20 text-green-600 border-green-500/30',
  SUSPENDED: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  CANCELLED: 'bg-red-500/20 text-red-600 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'פעיל',
  SUSPENDED: 'מושהה',
  CANCELLED: 'מבוטל',
};

export function TenantTable({ tenants, onDelete }: TenantTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק עסק זה?')) return;

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
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">שם</TableHead>
            <TableHead className="text-right">מזהה</TableHead>
            <TableHead className="text-right">סטטוס</TableHead>
            <TableHead className="text-right">משתמשים</TableHead>
            <TableHead className="text-right">סניפים</TableHead>
            <TableHead className="text-right">נוצר</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium">
                {tenant.name}
              </TableCell>
              <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('capitalize', statusColors[tenant.status])}
                >
                  {statusLabels[tenant.status] || tenant.status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {tenant._count.tenantUsers}
              </TableCell>
              <TableCell>
                {tenant._count.branches}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(tenant.createdAt).toLocaleDateString('he-IL')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/tenants/${tenant.id}`}>
                        <Eye className="ml-2 h-4 w-4" />
                        צפייה בפרטים
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/tenants/${tenant.id}/edit`}>
                        <Edit className="ml-2 h-4 w-4" />
                        עריכה
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(tenant.id)}
                      disabled={deletingId === tenant.id}
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      {deletingId === tenant.id ? 'מוחק...' : 'מחיקה'}
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
                className="text-center text-muted-foreground py-8"
              >
                לא נמצאו עסקים
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
