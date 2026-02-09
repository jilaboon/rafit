'use client';

import { Clock, MapPin, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { ClassCardData } from './class-card';

interface BookingSheetProps {
  classData: ClassCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function BookingSheet({
  classData,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: BookingSheetProps) {
  if (!classData) return null;

  const startTime = new Date(classData.startTime);
  const endTime = new Date(classData.endTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{'\u05D0\u05D9\u05E9\u05D5\u05E8 \u05D4\u05E8\u05E9\u05DE\u05D4'}</DialogTitle>
          <DialogDescription>
            {'\u05D4\u05D0\u05DD \u05DC\u05D0\u05E9\u05E8 \u05D4\u05E8\u05E9\u05DE\u05D4 \u05DC\u05E9\u05D9\u05E2\u05D5\u05E8?'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <h3 className="text-lg font-semibold">{classData.serviceName}</h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(startTime, 'EEEE, d \u05D1MMMM', { locale: he })}
              {' \u00B7 '}
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </span>
            {classData.coachName && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {classData.coachName}
              </span>
            )}
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {classData.branchName}
              {classData.roomName && ` \u00B7 ${classData.roomName}`}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {classData.availableSpots > 0
                ? `${classData.availableSpots} \u05DE\u05E7\u05D5\u05DE\u05D5\u05EA \u05E4\u05E0\u05D5\u05D9\u05D9\u05DD`
                : '\u05E8\u05E9\u05D9\u05DE\u05EA \u05D4\u05DE\u05EA\u05E0\u05D4'}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
          <Button onClick={onConfirm} disabled={isLoading} className="flex-1">
            {isLoading
              ? '\u05E8\u05D5\u05E9\u05DD...'
              : classData.availableSpots > 0
                ? '\u05D0\u05D9\u05E9\u05D5\u05E8 \u05D4\u05E8\u05E9\u05DE\u05D4'
                : '\u05D4\u05E8\u05E9\u05DE\u05D4 \u05DC\u05E8\u05E9\u05D9\u05DE\u05EA \u05D4\u05DE\u05EA\u05E0\u05D4'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            {'\u05D1\u05D9\u05D8\u05D5\u05DC'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
