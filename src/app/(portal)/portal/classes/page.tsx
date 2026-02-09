'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@/components/portal/date-picker';
import { ClassCard, type ClassCardData } from '@/components/portal/class-card';
import { BookingSheet } from '@/components/portal/booking-sheet';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function PortalClassesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassCardData | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['portal-classes', dateStr, selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams({ date: dateStr });
      if (selectedBranchId) params.set('branchId', selectedBranchId);
      const res = await fetch(`/api/portal/classes?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ classes: ClassCardData[]; branches: { id: string; name: string }[] }>;
    },
  });

  const bookMutation = useMutation({
    mutationFn: async (classInstanceId: string) => {
      const res = await fetch('/api/portal/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classInstanceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to book');
      return json as { message: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['portal-classes'] });
      queryClient.invalidateQueries({ queryKey: ['portal-bookings'] });
      toast({ description: result.message || '\u05D4\u05D4\u05D6\u05DE\u05E0\u05D4 \u05D0\u05D5\u05E9\u05E8\u05D4!' });
      setSelectedClass(null);
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: 'destructive' });
    },
  });

  const handleSelect = useCallback((classData: ClassCardData) => {
    setSelectedClass(classData);
  }, []);

  const handleBookConfirm = useCallback(() => {
    if (selectedClass) {
      bookMutation.mutate(selectedClass.id);
    }
  }, [selectedClass, bookMutation]);

  const branches = data?.branches || [];
  const showBranchFilter = branches.length > 1;

  return (
    <div>
      <div className="border-b">
        <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {showBranchFilter && (
        <div className="flex gap-2 overflow-x-auto border-b px-4 py-2 scrollbar-hide">
          <button
            onClick={() => setSelectedBranchId(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors ${
              selectedBranchId === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {'\u05D4\u05DB\u05DC'}
          </button>
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => setSelectedBranchId(branch.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors ${
                selectedBranchId === branch.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {branch.name}
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">{'\u05E9\u05D9\u05E2\u05D5\u05E8\u05D9\u05DD'}</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.classes?.length ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>{'\u05D0\u05D9\u05DF \u05E9\u05D9\u05E2\u05D5\u05E8\u05D9\u05DD \u05D1\u05D9\u05D5\u05DD \u05D6\u05D4'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.classes.map((cls) => (
              <ClassCard
                key={cls.id}
                classData={cls}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>

      <BookingSheet
        classData={selectedClass}
        open={selectedClass !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedClass(null);
        }}
        onConfirm={handleBookConfirm}
        isLoading={bookMutation.isPending}
      />
    </div>
  );
}
