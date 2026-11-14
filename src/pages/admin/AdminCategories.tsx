import * as React from 'react';
import { BarChart3, Tags } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/misc';
import { PageHeader } from '@/components/DashboardShell';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { CO2_FACTOR } from '@/data/categories';
import { cn, formatCurrency } from '@/lib/utils';

export default function AdminCategories() {
  const { state, toggleCategory } = useAppStore();
  const toast = useToast();

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Enable or pause categories across the marketplace"
        action={<Badge variant="secondary"><Tags className="h-3 w-3" /> {state.categories.length} categories</Badge>}
      />

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        <ul className="divide-y divide-border/60">
          {state.categories.map((c) => {
            const rate = state.rates.find((r) => r.category === c.slug)?.ratePerKg ?? 0;
            const listings = state.listings.filter((l) => l.category === c.slug).length;
            return (
              <li key={c.slug} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <CategoryIcon slug={c.slug} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <span className="text-[11px] text-muted-foreground">
                      {c.nameHi} · {c.nameMr}
                    </span>
                    {!c.active && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{c.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="font-semibold">{formatCurrency(rate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Listings</p>
                    <p className="font-semibold">{listings}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CO₂/kg</p>
                    <p className="font-semibold">{CO2_FACTOR[c.slug]}</p>
                  </div>
                </div>
                <Switch
                  checked={c.active}
                  onCheckedChange={() => {
                    const res = toggleCategory(c.slug);
                    if (!res.ok) toast.error('Could not update', res.error);
                    else toast.success(c.active ? `${c.name} paused` : `${c.name} enabled`);
                  }}
                  aria-label={`Toggle ${c.name}`}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className={cn('mt-4 flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground')}>
        <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Pausing a category hides it from new listings and the public rate card, but existing listings and
        orders stay visible until they are completed.
      </div>
    </div>
  );
}
