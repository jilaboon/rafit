'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Home,
  Menu,
  X,
  LogOut,
  User,
  Building2,
  Dumbbell,
  Bell,
  ChevronLeft,
  UserCog,
  ClipboardCheck,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { UserRole } from '@prisma/client';
import { Permission, hasAnyPermission } from '@/lib/auth/rbac';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/auth/rbac';

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    tenantId?: string;
    role?: string;
    isImpersonating?: boolean;
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: Permission[];
  roles?: UserRole[];
}

const navigation: NavItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', icon: Home },
  {
    name: 'לוח זמנים',
    href: '/dashboard/schedule',
    icon: Calendar,
    permissions: ['schedule:read'],
  },
  {
    name: 'צ\'ק-אין',
    href: '/dashboard/checkin',
    icon: ClipboardCheck,
    permissions: ['booking:checkin'],
  },
  {
    name: 'לקוחות',
    href: '/dashboard/customers',
    icon: Users,
    permissions: ['customer:read'],
  },
  {
    name: 'חברויות',
    href: '/dashboard/memberships',
    icon: CreditCard,
    permissions: ['membership:read'],
  },
  {
    name: 'שירותים',
    href: '/dashboard/services',
    icon: Dumbbell,
    permissions: ['service:read'],
  },
  {
    name: 'סניפים',
    href: '/dashboard/branches',
    icon: Building2,
    permissions: ['branch:read'],
  },
  {
    name: 'דוחות',
    href: '/dashboard/reports',
    icon: BarChart3,
    permissions: ['report:revenue', 'report:attendance', 'report:members'],
  },
  {
    name: 'צוות',
    href: '/dashboard/team',
    icon: UserCog,
    permissions: ['user:read'],
  },
  {
    name: 'הגדרות',
    href: '/dashboard/settings',
    icon: Settings,
    permissions: ['tenant:read'],
  },
];

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter navigation items based on user role
  const filteredNavigation = useMemo(() => {
    const userRole = user.role as UserRole | undefined;
    if (!userRole) return navigation.filter((item) => !item.permissions);

    return navigation.filter((item) => {
      // No permission requirement - show to everyone
      if (!item.permissions || item.permissions.length === 0) return true;
      // Check if user has any of the required permissions
      return hasAnyPermission(userRole, item.permissions);
    });
  }, [user.role]);

  const roleLabel = user.role ? ROLE_LABELS[user.role as UserRole] : undefined;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-72 bg-background border-l transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="brand-name text-lg font-bold text-primary-foreground">R</span>
              </div>
              <span className="brand-name text-xl font-bold">RAFIT</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start text-sm">
                    <span className="font-medium">{user.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      {roleLabel && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {roleLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="ml-2 h-4 w-4" />
                    פרופיל
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="ml-2 h-4 w-4" />
                    הגדרות
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/business">
                    <Building2 className="ml-2 h-4 w-4" />
                    פרטי העסק
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pr-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
              3
            </span>
          </Button>

          {/* Mobile user menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">פרופיל</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">הגדרות</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
