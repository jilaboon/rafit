'use client';

import { Clock, MapPin, User, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export interface ClassCardData {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  availableSpots: number;
  branchName: string;
  coachName: string | null;
  roomName: string | null;
  serviceName: string;
  creditCost: number;
  isBooked: boolean;
  bookingStatus: string | null;
}

interface ClassCardProps {
  classData: ClassCardData;
  onSelect: (classData: ClassCardData) => void;
}

export function ClassCard({ classData, onSelect }: ClassCardProps) {
  const startTime = new Date(classData.startTime);
  const endTime = new Date(classData.endTime);
  const isFull = classData.availableSpots <= 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (!classData.isBooked) onSelect(classData);
      }}
      disabled={classData.isBooked}
      className="w-full rounded-xl border bg-card p-4 text-right transition-colors hover:bg-accent/50 disabled:cursor-default disabled:hover:bg-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{classData.serviceName}</h3>
          <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </span>
            {classData.coachName && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {classData.coachName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {classData.branchName}
              {classData.roomName && ` \u00B7 ${classData.roomName}`}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {classData.availableSpots > 0
                ? `${classData.availableSpots} \u05DE\u05E7\u05D5\u05DE\u05D5\u05EA \u05E4\u05E0\u05D5\u05D9\u05D9\u05DD`
                : '\u05DE\u05DC\u05D0'}
            </span>
          </div>
        </div>
        <div className="mr-3 flex flex-col items-end gap-2">
          {classData.isBooked ? (
            <Badge variant="secondary">{'\u05E0\u05E8\u05E9\u05DE\u05EA'}</Badge>
          ) : isFull ? (
            <Badge variant="outline">{'\u05DE\u05DC\u05D0'}</Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}
