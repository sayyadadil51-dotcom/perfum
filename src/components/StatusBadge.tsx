import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { ListingStatus, OrderStatus, OfferStatus } from '@/lib/types';

type AnyStatus = ListingStatus | OrderStatus | OfferStatus | 'pending' | 'approved' | 'rejected' | 'active' | 'suspended' | 'open' | 'resolved';

const MAP: Record<string, { label: string; className: string; dot: string }> = {
  listed: { label: 'Listed', className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25', dot: 'bg-sky-500' },
  accepted: { label: 'Accepted', className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/25', dot: 'bg-violet-500' },
  scheduled: { label: 'Pickup scheduled', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25', dot: 'bg-amber-500' },
  pickup_scheduled: { label: 'Pickup scheduled', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25', dot: 'bg-amber-500' },
  picked_up: { label: 'Picked up', className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/25', dot: 'bg-teal-500' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground/50' },
  disputed: { label: 'Disputed', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25', dot: 'bg-red-500' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25', dot: 'bg-amber-500' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25', dot: 'bg-red-500' },
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25', dot: 'bg-emerald-500' },
  suspended: { label: 'Suspended', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25', dot: 'bg-red-500' },
  open: { label: 'Open', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25', dot: 'bg-amber-500' },
  resolved: { label: 'Resolved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25', dot: 'bg-emerald-500' },
  withdrawn: { label: 'Withdrawn', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground/50' },
  countered: { label: 'Countered', className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25', dot: 'bg-indigo-500' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground/50' },
};

export function StatusBadge({
  status,
  className,
  withDot = true,
}: {
  status: AnyStatus | string;
  className?: string;
  withDot?: boolean;
}) {
  const conf = MAP[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground/50' };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        conf.className,
        className,
      )}
    >
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', conf.dot)} />}
      {conf.label}
    </span>
  );
}

const FLOW: { key: string; label: string }[] = [
  { key: 'listed', label: 'Listed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'scheduled', label: 'Pickup' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'paid', label: 'Paid' },
];

const ORDER_FLOW: { key: string; label: string }[] = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'pickup_scheduled', label: 'Scheduled' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'paid', label: 'Paid' },
];

/** Horizontal progress tracker for listings or orders. */
export function StatusTimeline({
  current,
  kind = 'listing',
  className,
}: {
  current: string;
  kind?: 'listing' | 'order';
  className?: string;
}) {
  const steps = kind === 'listing' ? FLOW : ORDER_FLOW;
  const idx = steps.findIndex((s) => s.key === current || (current === 'scheduled' && s.key === 'pickup_scheduled'));
  const cancelled = ['cancelled', 'disputed', 'rejected'].includes(current);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {steps.map((s, i) => {
          const done = idx >= i && !cancelled;
          const active = idx === i && !cancelled;
          return (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'grid h-6 w-6 place-items-center rounded-full border-2 text-[10px] font-bold transition-colors',
                    done
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground',
                    active && 'ring-4 ring-primary/15',
                  )}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span
                  className={cn(
                    'whitespace-nowrap text-[10px] font-medium',
                    done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-1 mb-4 h-0.5 flex-1 rounded-full transition-colors sm:mx-2',
                    idx > i && !cancelled ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {cancelled && (
        <p className="mt-2 text-xs font-medium text-destructive">
          This {kind} was {current}.
        </p>
      )}
    </div>
  );
}

/** Small clickable rating stars, read-only or interactive. */
export function Stars({
  value,
  onChange,
  size = 'sm',
  className,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [hover, setHover] = React.useState(0);
  const px = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' }[size];
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)} role={onChange ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = (hover || value) >= i;
        return onChange ? (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <svg viewBox="0 0 24 24" className={cn(px, filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground/40')} stroke="currentColor" strokeWidth={1.6}>
              <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9L12 2.5z" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <svg key={i} viewBox="0 0 24 24" className={cn(px, filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground/30')} stroke="currentColor" strokeWidth={1.6} aria-hidden>
            <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9L12 2.5z" strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
}

/** Compact link used inside tables on mobile cards. */
export function RowLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-primary hover:underline">
      {children}
    </Link>
  );
}
