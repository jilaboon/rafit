'use client';

import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

/**
 * Syncs theme preference from the DB to next-themes on initial load.
 * Only runs once after the user is authenticated.
 */
export function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const { status } = useSession();
  const synced = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || synced.current) return;
    synced.current = true;

    fetch('/api/users/me')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        const pref = data?.user?.themePreference;
        if (pref && ['light', 'dark', 'system'].includes(pref)) {
          setTheme(pref);
        }
      })
      .catch(() => {
        // Silently fail - keep local theme
      });
  }, [status, setTheme]);

  return <>{children}</>;
}
