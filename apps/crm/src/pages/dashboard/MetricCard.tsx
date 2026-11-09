import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  sublabel,
  to,
  urgent = false,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  to: string;
  urgent?: boolean;
}) {
  const isUrgent = urgent && (typeof value === 'number' ? value > 0 : true);
  return (
    <Link to={to}>
      <div
        className={cn(
          'rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer',
          isUrgent && 'border-red-200 bg-red-50/50'
        )}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn('mt-1 text-3xl font-bold tabular-nums', isUrgent && 'text-red-600')}>
          {value}
        </p>
        {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </Link>
  );
}

export function SkeletonCard() {
  return <div className="animate-pulse bg-muted rounded-lg h-24" />;
}
