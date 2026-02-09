'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Bookmark, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/portal', label: '\u05E8\u05D0\u05E9\u05D9', icon: Home, exact: true },
  { href: '/portal/classes', label: '\u05E9\u05D9\u05E2\u05D5\u05E8\u05D9\u05DD', icon: Calendar },
  { href: '/portal/bookings', label: '\u05D4\u05D6\u05DE\u05E0\u05D5\u05EA', icon: Bookmark },
  { href: '/portal/membership', label: '\u05DE\u05E0\u05D5\u05D9', icon: CreditCard },
  { href: '/portal/profile', label: '\u05E4\u05E8\u05D5\u05E4\u05D9\u05DC', icon: User },
];

export function PortalBottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
