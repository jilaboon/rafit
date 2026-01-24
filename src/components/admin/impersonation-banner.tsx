'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

interface ImpersonationBannerProps {
  impersonatedUserId?: string;
}

export function ImpersonationBanner({ impersonatedUserId }: ImpersonationBannerProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleStopImpersonation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update session to stop impersonation
        await update({ stopImpersonation: true });
        router.push('/admin');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">
            You are currently impersonating a user
          </span>
          {impersonatedUserId && (
            <span className="text-red-200 text-sm">
              (User ID: {impersonatedUserId.slice(0, 8)}...)
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={isLoading}
          className="bg-white text-red-600 hover:bg-red-50 border-white"
        >
          {isLoading ? (
            'Stopping...'
          ) : (
            <>
              <X className="h-4 w-4 mr-1" />
              Stop Impersonation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
