import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Handshake, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/DashboardShell';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { categoryName } from '@/data/categories';
import { cn, formatCurrency, formatDate, formatWeight, timeAgo } from '@/lib/utils';

export default function BuyerOffers() {
  const { state, currentUser, lang, rateFor } = useAppStore();
  const navigate = useNavigate();
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('pending');

  const offers = state.offers
    .filter((o) => o.buyerId === currentUser?.id)
    .filter((o) => {
      if (!q.trim()) return true;
      const l = state.listings.find((x) => x.id === o.listingId);
      const s = q.trim().toLowerCase();
      return l?.title.toLowerCase().includes(s) || o.listingId.includes(s);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const groups = {
    pending: offers.filter((o) => o.status === 'pending' || o.status === 'countered'),
    accepted: offers.filter((o) => o.status === 'accepted'),
    closed: offers.filter((o) => ['rejected', 'withdrawn'].includes(o.status)),
  };

  const Row = ({ id }: { id: string }) => {
    const offer = state.offers.find((o) => o.id === id)!;
    const listing = state.listings.find((l) => l.id === offer.listingId);
    const market = rateFor(offer.listingId ? (listing?.category ?? 'other') : 'other');
    const diff = offer.ratePerKg - market;
    const order = state.orders.find((o) => o.listingId === offer.listingId && o.buyerId === currentUser?.id);

    return (
      <li className="rounded-xl border border-border/70 p-3.5 transition hover:border-primary/30">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <CategoryIcon slug={listing?.category ?? 'other'} size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{listing?.title ?? 'Listing removed'}</p>
                <StatusBadge status={offer.status} />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {listing ? `${categoryName(listing.category, lang)} · ${formatWeight(listing.weightKg)}` : ''} · sent {timeAgo(offer.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-sm font-bold">{formatCurrency(offer.ratePerKg)}/kg</p>
            <p className="text-[10px] text-muted-foreground">≈ {formatCurrency(offer.amount)}</p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {diff >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-amber-600" />}
            {diff >= 0 ? '+' : ''}{formatCurrency(diff)} vs market
          </span>
          <span>Pickup {formatDate(offer.pickupDate)}</span>
        </div>

        {offer.message && (
          <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">"{offer.message}"</p>
        )}

        <div className="mt-2.5 flex justify-end gap-2">
          {offer.status === 'accepted' && order && (
            <Button size="sm" asChild>
              <Link to={`/buyer/orders/${order.id}`}>Manage order</Link>
            </Button>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link to={`/buyer/listing/${offer.listingId}`}>View listing</Link>
          </Button>
        </div>
      </li>
    );
  };

  const Empty = ({ title, desc }: { title: string; desc: string }) => (
    <EmptyState icon={Handshake} title={title} description={desc} className="border-0 py-10" />
  );

  return (
    <div>
      <PageHeader title="My offers" description={`${offers.length} offer${offers.length === 1 ? '' : 's'} sent`} />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search offers…" className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({groups.accepted.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({groups.closed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {groups.pending.length ? (
            <ul className="space-y-2.5">{groups.pending.map((o) => <Row key={o.id} id={o.id} />)}</ul>
          ) : (
            <Empty title="No pending offers" desc="Browse listings and send an offer to get started." />
          )}
        </TabsContent>
        <TabsContent value="accepted">
          {groups.accepted.length ? (
            <ul className="space-y-2.5">{groups.accepted.map((o) => <Row key={o.id} id={o.id} />)}</ul>
          ) : (
            <Empty title="Nothing accepted yet" desc="Offers accepted by sellers will appear here." />
          )}
        </TabsContent>
        <TabsContent value="closed">
          {groups.closed.length ? (
            <ul className="space-y-2.5">{groups.closed.map((o) => <Row key={o.id} id={o.id} />)}</ul>
          ) : (
            <Empty title="No closed offers" desc="Declined and withdrawn offers are archived here." />
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-5 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
        Tip: sellers respond fastest to offers with a clear pickup date and a short, specific message.
        Anything more than 15% below market rate is usually declined.
      </div>
      <button onClick={() => navigate('/buyer')} className="sr-only">Browse listings</button>
    </div>
  );
}
