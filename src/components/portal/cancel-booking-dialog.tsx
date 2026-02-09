'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CancelBookingDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{'\u05D1\u05D9\u05D8\u05D5\u05DC \u05D4\u05D6\u05DE\u05E0\u05D4'}</AlertDialogTitle>
          <AlertDialogDescription>
            {'\u05D4\u05D0\u05DD \u05D0\u05EA/\u05D4 \u05D1\u05D8\u05D5\u05D7/\u05D4 \u05E9\u05D1\u05E8\u05E6\u05D5\u05E0\u05DA \u05DC\u05D1\u05D8\u05DC \u05D4\u05D6\u05DE\u05E0\u05D4 \u05D6\u05D5? \u05D4\u05E4\u05E2\u05D5\u05DC\u05D4 \u05DC\u05D0 \u05E0\u05D9\u05EA\u05E0\u05EA \u05DC\u05D1\u05D9\u05D8\u05D5\u05DC.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel disabled={isLoading}>{'\u05D7\u05D6\u05E8\u05D4'}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? '\u05DE\u05D1\u05D8\u05DC...' : '\u05D1\u05D8\u05DC \u05D4\u05D6\u05DE\u05E0\u05D4'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
