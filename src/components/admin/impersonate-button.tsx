'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { UserCog } from 'lucide-react';

interface ImpersonateButtonProps {
  userId: string;
  userName: string;
}

export function ImpersonateButton({ userId, userName }: ImpersonateButtonProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleImpersonate = async () => {
    if (!confirm(`האם אתה בטוח שברצונך להתחבר כ-${userName}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok && data.impersonate) {
        // Update session with impersonation data
        await update({
          impersonate: true,
          impersonatedUserId: data.impersonate.userId,
        });

        // Redirect to dashboard as the impersonated user
        router.push('/dashboard');
        router.refresh();
      } else {
        alert(data.error || 'שגיאה בהתחברות כמשתמש אחר');
      }
    } catch (error) {
      console.error('Failed to impersonate:', error);
      alert('שגיאה בהתחברות כמשתמש אחר');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleImpersonate}
      disabled={isLoading}
      className="text-slate-400 hover:text-white"
    >
      <UserCog className="h-4 w-4 ml-1" />
      {isLoading ? 'טוען...' : 'התחבר כמשתמש'}
    </Button>
  );
}
