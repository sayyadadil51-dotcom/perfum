import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, Search, TrendingDown, TrendingUp, Info, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useAppStore } from '@/context/AppStore';
import { CATEGORIES, categoryName } from '@/data/categories';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

/** Tiny inline sparkline for the last 14 days of rates. */
function Sparkline({ data, up }: { data: { date: string; rate: number }[]; up: boolean }) {
  if (data.length < 2) return null;
  const w = 84;
  const h = 26;
  const min = Math.min(...data.map((d) => d.rate));
  const max = Math.max(...data.map((d) => d.rate));
  const span = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.rate - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? '#16a34a' : '#ef4444'}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Rates() {
  const { state, lang, t } = useAppStore();
  const [q, setQ] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [updatedAt, setUpdatedAt] = React.useState(Date.now());

  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
    }
  }, []);

  const rows = state.rates
    .filter((r) => CATEGORIES.some((c) => c.slug === r.category && c.active))
    .filter((r) => {
      if (!q.trim()) return true;
      const cat = CATEGORIES.find((c) => c.slug === r.category);
      const needle = q.trim().toLowerCase();
      return (
        cat?.name.toLowerCase().includes(needle) ||
        cat?.nameHi.includes(needle) ||
        cat?.nameMr.includes(needle) ||
        r.category.includes(needle)
      );
    })
    .sort((a, b) => b.ratePerKg - a.ratePerKg);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setUpdatedAt(Date.now());
    }, 900);
  };

  const exportCsv = () => {
    const csv = [
      'Category,Rate per kg (INR),Change %,Updated',
      ...rows.map(
        (r) =>
          `${categoryName(r.category, 'en')},${r.ratePerKg},${r.changePct},${r.updatedAt.slice(0, 10)}`,
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scrapkart-rates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="container py-8 lg:py-12">
      <div className="max-w-2xl">
        <Badge variant="success" className="mb-3">
          <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
          Updated {formatDate(new Date(updatedAt), true)}
        </Badge>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Today's scrap rates</h1>
        <p className="mt-2 text-muted-foreground">
          Buying rates per kilogram across Nagpur. Dealers may quote slightly higher for large, clean
          lots — that is what offers are for.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search category…"
            className="pl-9"
            aria-label={t('common.search')}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} loading={refreshing}>
            {!refreshing && <RefreshCw className="h-4 w-4" />} Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">14-day trend</th>
              <th className="px-4 py-3 text-right font-semibold">Rate / kg</th>
              <th className="px-4 py-3 text-right font-semibold">Change</th>
              <th className="px-4 py-3 text-right font-semibold">Est. for 10 kg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((r) => {
              const up = r.changePct >= 0;
              return (
                <tr key={r.id} id={r.category} className="transition hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CategoryIcon slug={r.category} size="sm" />
                      <div>
                        <p className="font-semibold">{categoryName(r.category, lang)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {CATEGORIES.find((c) => c.slug === r.category)?.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Sparkline data={r.history} up={up} />
                  </td>
                  <td className="px-4 py-3 text-right font-display text-lg font-bold">
                    {formatCurrency(r.ratePerKg)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-bold',
                        up ? 'text-emerald-600' : 'text-red-500',
                      )}
                    >
                      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {up ? '+' : ''}
                      {r.changePct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {formatCurrency(r.ratePerKg * 10)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No categories match "{q}".</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-2.5 md:hidden">
        {rows.map((r) => {
          const up = r.changePct >= 0;
          return (
            <div key={r.id} id={`${r.category}-m`} className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <CategoryIcon slug={r.category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{categoryName(r.category, lang)}</p>
                  <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold', up ? 'text-emerald-600' : 'text-red-500')}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {up ? '+' : ''}{r.changePct}%
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold leading-none">{formatCurrency(r.ratePerKg)}</p>
                  <p className="text-[10px] text-muted-foreground">per kg</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                <Sparkline data={r.history} up={up} />
                <span className="text-[11px] text-muted-foreground">10 kg ≈ {formatCurrency(r.ratePerKg * 10)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Rates shown are indicative buying rates. Final price depends on condition, cleanliness and
          the dealer's offer — always confirmed before pickup.
        </p>
        <Button asChild className="shrink-0">
          <Link to="/seller/new">List scrap now <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}
