import * as React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ListChecks, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/DashboardShell';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { categoryName } from '@/data/categories';
import { formatCurrency, formatDate, formatWeight } from '@/lib/utils';

export default function AdminListings() {
  const { state, lang } = useAppStore();
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');

  const listings = state.listings
    .filter((l) => (status === 'all' ? true : l.status === status))
    .filter((l) => {
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return l.title.toLowerCase().includes(s) || l.pickup.city.toLowerCase().includes(s) || l.id.includes(s);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const stats = [
    { label: 'Listed', count: state.listings.filter((l) => l.status === 'listed').length, variant: 'info' as const },
    { label: 'Accepted', count: state.listings.filter((l) => l.status === 'accepted').length, variant: 'default' as const },
    { label: 'Scheduled', count: state.listings.filter((l) => l.status === 'scheduled').length, variant: 'warning' as const },
    { label: 'Picked up', count: state.listings.filter((l) => l.status === 'picked_up').length, variant: 'success' as const },
    { label: 'Paid', count: state.listings.filter((l) => l.status === 'paid').length, variant: 'success' as const },
    { label: 'Cancelled', count: state.listings.filter((l) => l.status === 'cancelled').length, variant: 'secondary' as const },
  ];

  return (
    <div>
      <PageHeader title="All listings" description={`${state.listings.length} listings across the platform`} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {stats.map((s) => (
          <Badge key={s.label} variant={s.variant} className="px-2.5 py-1">
            {s.label}: {s.count}
          </Badge>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, city or ID…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['listed', 'accepted', 'scheduled', 'picked_up', 'paid', 'cancelled'].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {listings.length === 0 ? (
        <EmptyState icon={ListChecks} title="No listings found" description="Try a different filter." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Listing</th>
                  <th className="px-4 py-2.5 font-semibold">Seller</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Weight</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Value</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Created</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {listings.map((l) => {
                  const seller = state.users.find((u) => u.id === l.sellerId);
                  return (
                    <tr key={l.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon slug={l.category} size="sm" />
                          <div>
                            <p className="line-clamp-1 font-medium">{l.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {categoryName(l.category, lang)} · {l.pickup.city} · {l.offerCount} offers
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{seller?.name}</p>
                        <p className="text-[11px] text-muted-foreground">{seller?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-right">{formatWeight(l.weightKg)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(l.estimatedPrice)}</td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-4 py-3 text-right text-[11px] text-muted-foreground">{formatDate(l.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="icon-sm" variant="ghost" asChild aria-label="View listing">
                          <Link to={`/listing/${l.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border/60 lg:hidden">
            {listings.map((l) => {
              const seller = state.users.find((u) => u.id === l.sellerId);
              return (
                <li key={l.id} className="p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CategoryIcon slug={l.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.title}</p>
                      <p className="text-[11px] text-muted-foreground">{seller?.name} · {formatDate(l.createdAt)}</p>
                    </div>
                    <StatusBadge status={l.status} withDot={false} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{formatWeight(l.weightKg)} · {formatCurrency(l.estimatedPrice)}</span>
                    <Link to={`/listing/${l.id}`} className="font-medium text-primary hover:underline">View</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
