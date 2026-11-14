import * as React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/context/AppStore';
import { Avatar, AvatarFallback } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stars } from '@/components/StatusBadge';
import { Leaf } from 'lucide-react';

export interface DashNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: number;
}

/**
 * Shared dashboard chrome: sticky sidebar on desktop, horizontal scroll nav on mobile.
 */
export function DashboardShell({
  title,
  subtitle,
  nav,
  actions,
  children,
  accent,
}: {
  title: string;
  subtitle?: string;
  nav: DashNavItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  accent?: React.ReactNode;
}) {
  const { currentUser } = useAppStore();
  const roleLabel =
    currentUser?.role === 'seller' ? 'Seller' : currentUser?.role === 'buyer' ? 'Verified dealer' : 'Administrator';

  return (
    <div className="container py-6 lg:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/15">
            <AvatarFallback name={currentUser?.name ?? 'SK'} className="text-sm" />
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">
                {currentUser?.name ?? title}
              </h1>
              <Badge variant={currentUser?.role === 'admin' ? 'clay' : 'success'} className="text-[10px]">
                {roleLabel}
              </Badge>
              {currentUser?.verificationStatus === 'pending' && (
                <Badge variant="warning" className="text-[10px]">Pending approval</Badge>
              )}
              {currentUser?.status === 'suspended' && (
                <Badge variant="danger" className="text-[10px]">Suspended</Badge>
              )}
            </div>
            {/* div (not p): Stars renders divs, which are invalid inside <p> */}
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{subtitle ?? currentUser?.city}</span>
              {!!currentUser?.rating && currentUser.ratingCount ? (
                <>
                  <span className="hidden sm:inline">·</span>
                  <Stars value={Math.round(currentUser.rating)} />
                  <span>{currentUser.rating} ({currentUser.ratingCount})</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      {accent}

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1" aria-label="Dashboard">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {!!item.badge && item.badge > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-leaf-800 dark:text-leaf-300">
              <Leaf className="h-3.5 w-3.5" /> Green tip
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Clean, sorted scrap fetches 10–25% higher rates. Rinse bottles and remove tape from cartons.
            </p>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {/* Mobile horizontal nav */}
          <nav className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1 no-scrollbar lg:hidden" aria-label="Dashboard sections">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground',
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
                {!!item.badge && item.badge > 0 && (
                  <span className="rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </nav>
          {children ?? <Outlet />}
        </div>
      </div>
    </div>
  );
}

/** Compact KPI tile used across dashboards. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
  tone = 'primary',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label?: string };
  className?: string;
  tone?: 'primary' | 'clay' | 'sky' | 'violet';
}) {
  const tones = {
    primary: 'bg-secondary text-leaf-700 dark:text-leaf-300',
    clay: 'bg-clay-100 text-clay-700 dark:bg-clay-500/15 dark:text-clay-200',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  };
  return (
    <div className={cn('rounded-2xl border border-border/70 bg-card p-4 shadow-soft', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn('grid h-8 w-8 place-items-center rounded-lg', tones[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold leading-none">{value}</p>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
        {trend && (
          <span className={cn('font-semibold', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border/70 bg-card shadow-soft', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function GuideLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Button variant="link" asChild className="h-auto p-0 text-xs">
      <Link to={to}>{children}</Link>
    </Button>
  );
}
