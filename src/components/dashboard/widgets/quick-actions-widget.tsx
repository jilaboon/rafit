'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  CalendarPlus,
  CreditCard,
  ClipboardCheck,
  Users,
  Zap,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

const allActions: QuickAction[] = [
  {
    label: 'לקוח חדש',
    href: '/dashboard/customers/new',
    icon: UserPlus,
    permission: 'customer:create',
  },
  {
    label: 'הזמנה חדשה',
    href: '/dashboard/schedule?action=book',
    icon: CalendarPlus,
    permission: 'booking:create',
  },
  {
    label: 'צ\'ק-אין',
    href: '/dashboard/checkin',
    icon: ClipboardCheck,
    permission: 'booking:checkin',
  },
  {
    label: 'מנוי חדש',
    href: '/dashboard/memberships/new',
    icon: CreditCard,
    permission: 'membership:create',
  },
  {
    label: 'צוות',
    href: '/dashboard/team',
    icon: Users,
    permission: 'user:read',
  },
];

export function QuickActionsWidget() {
  const { can } = usePermissions();

  // Filter actions based on permissions
  const availableActions = allActions.filter(
    (action) => !action.permission || can(action.permission as any)
  );

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          פעולות מהירות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col gap-2"
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
