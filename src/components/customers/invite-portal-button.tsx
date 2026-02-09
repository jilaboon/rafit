'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Check, AlertCircle } from 'lucide-react';

export function InvitePortalButton({ customerId }: { customerId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInvite = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/customers/${customerId}/invite`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.error || 'אירעה שגיאה');
        return;
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('אירעה שגיאה בשליחת ההזמנה');
    }
  };

  if (status === 'success') {
    return (
      <Button variant="outline" size="sm" disabled>
        <Check className="mr-2 h-4 w-4" />
        ההזמנה נשלחה
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleInvite}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        הזמנה לפורטל
      </Button>
      {status === 'error' && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
