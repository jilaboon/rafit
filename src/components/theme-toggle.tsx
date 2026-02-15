'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const themes = [
  { value: 'system', label: 'מערכת', icon: Monitor },
  { value: 'light', label: 'בהיר', icon: Sun },
  { value: 'dark', label: 'כהה', icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const saveThemeToDb = async (newTheme: string) => {
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: newTheme }),
      });
    } catch {
      // Silently fail - theme is still applied locally via next-themes
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    saveThemeToDb(newTheme);
  };

  const currentIcon = () => {
    if (!mounted) return <Monitor className="h-4 w-4" />;
    const current = themes.find((t) => t.value === theme);
    const Icon = current?.icon ?? Monitor;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {currentIcon()}
          <span className="sr-only">החלף ערכת נושא</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => handleThemeChange(t.value)}
            className={theme === t.value ? 'bg-accent' : ''}
          >
            <t.icon className="ml-2 h-4 w-4" />
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
