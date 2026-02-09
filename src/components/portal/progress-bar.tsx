'use client';

export function ProgressBar({
  used,
  total,
  label,
}: {
  used: number;
  total: number;
  label: string;
}) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = total - used;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">
          נוצלו {used} מתוך {total} {label}
        </span>
        <span className="font-medium">{remaining} נותרו</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
