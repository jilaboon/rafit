'use client';

import { cn } from '@/lib/utils';
import { addDays, isSameDay, format } from 'date-fns';

const DAY_NAMES = ['\u05D9\u05D5\u05DD\u05F3', '\u05E9\u05E0\u05D9', '\u05E9\u05DC\u05D9\u05F3', '\u05E8\u05D1\u05D9\u05F3', '\u05D7\u05DE\u05D9\u05F3', '\u05E9\u05D9\u05E9\u05D9', '\u05E9\u05D1\u05EA'];

export function DatePicker({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, today);

        return (
          <button
            key={day.toISOString()}
            onClick={() => onDateChange(day)}
            className={cn(
              'flex min-w-[52px] flex-col items-center rounded-xl px-3 py-2 text-sm transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <span className="text-xs">{DAY_NAMES[day.getDay()]}</span>
            <span className="text-lg font-semibold">{format(day, 'd')}</span>
            {isToday && !isSelected && (
              <div className="mt-0.5 h-1 w-1 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
