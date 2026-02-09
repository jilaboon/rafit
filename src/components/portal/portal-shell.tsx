'use client';

import { PortalHeader } from './portal-header';
import { PortalBottomTabs } from './portal-bottom-tabs';

export function PortalShell({
  children,
  tenantName,
  userName,
}: {
  children: React.ReactNode;
  tenantName: string;
  userName: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <PortalHeader tenantName={tenantName} userName={userName} />
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <PortalBottomTabs />
    </div>
  );
}
