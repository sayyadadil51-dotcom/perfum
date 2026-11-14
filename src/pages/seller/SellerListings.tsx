import * as React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Eye, ListChecks, Plus, Search, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/DashboardShell';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { categoryName } from '@/data/categories';
import { formatCurrency, formatDate, formatWeight } from '@/lib/utils';
import type { Listing } from '@/lib/types';

export default function SellerListings() {
  const { state, currentUser, lang, cancelListing } = useAppStore();
  const toast = useToast();
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('active');
  const [toCancel, setToCancel] = React.useState<Listing | null>(null);

  const mine = state.listings
    .filter((l) => l.sellerId === currentUser?.id)
    .filter((l) => {
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return l.title.toLowerCase().includes(s) || l.id.toLowerCase().includes(s) || l.category.includes(s);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const groups: Record<string, Listing[]> = {
    active: mine.filter((l) => ['listed', 'accepted', 'scheduled'].includes(l.status)),
    progress: mine.filter((l) => ['picked_up'].includes(l.status)),
    closed: mine.filter((l) => ['paid', 'cancelled'].includes(l.status)),
  };

  const confirmCancel = () => {
    if (!toCancel) return;
    const res = cancelListing(toCancel.id);
    if (!res.ok) toast.error('Could not cancel', res.error);
    else toast.success('Listing cancelled', 'Interested dealers have been notified.');
    setToCancel(null);
  };

  const ListingRow = ({ l }: { l: Listing }) => (
    <li className="flex flex-col gap-3 rounded-xl border border-border/70 p-3 transition hover:border-primary/30 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {l.images[0] ? (
          <img src={l.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <CategoryIcon slug={l.category} size="md" />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{l.title}</p>
            <StatusBadge status={l.status} withDot={false} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {categoryName(l.category, lang)} · {formatWeight(l.weightKg)} · {formatDate(l.createdAt)}
            {l.offerCount > 0 && ` · ${l.offerCount} offer${l.offerCount > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="text-right">
          <p className="font-display text-sm font-bold text-primary">{formatCurrency(l.estimatedPrice)}</p>
          <p className="text-[10px] text-muted-foreground">est. value</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" asChild aria-label="View listing">
            <Link to={`/seller/listings/${l.id}`}><Eye className="h-4 w-4" /></Link>
          </Button>
          {['listed', 'accepted'].includes(l.status) && (
            <>
              <Button size="icon-sm" variant="ghost" asChild aria-label="Edit listing">
                <Link to={`/seller/listings/${l.id}/edit`}><Edit3 className="h-4 w-4" /></Link>
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setToCancel(l)}
                aria-label="Cancel listing"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );

  const Empty = ({ title, desc }: { title: string; desc: string }) => (
    <EmptyState
      icon={ListChecks}
      title={title}
      description={desc}
      action={<Button asChild><Link to="/seller/new"><Plus className="h-4 w-4" /> Sell scrap</Link></Button>}
      className="border-0 py-10"
    />
  );

  return (
    <div>
      <PageHeader
        title="My listings"
        description={`${mine.length} listing${mine.length === 1 ? '' : 's'} total`}
        action={
          <Button asChild size="sm">
            <Link to="/seller/new"><Plus className="h-4 w-4" /> New listing</Link>
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search my listings…" className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({groups.active.length})</TabsTrigger>
          <TabsTrigger value="progress">Picked up ({groups.progress.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({groups.closed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {groups.active.length ? (
            <ul className="space-y-2">{groups.active.map((l) => <ListingRow key={l.id} l={l} />)}</ul>
          ) : (
            <Empty title="No active listings" desc="List your scrap to start receiving offers from verified dealers." />
          )}
        </TabsContent>
        <TabsContent value="progress">
          {groups.progress.length ? (
            <ul className="space-y-2">{groups.progress.map((l) => <ListingRow key={l.id} l={l} />)}</ul>
          ) : (
            <Empty title="Nothing in progress" desc="Listings collected by a dealer but not yet paid appear here." />
          )}
        </TabsContent>
        <TabsContent value="closed">
          {groups.closed.length ? (
            <ul className="space-y-2">{groups.closed.map((l) => <ListingRow key={l.id} l={l} />)}</ul>
          ) : (
            <Empty title="No closed listings yet" desc="Completed and cancelled listings will be archived here." />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this listing?</DialogTitle>
            <DialogDescription>
              "{toCancel?.title}" will be removed from the marketplace and pending offers will be
              withdrawn. You can create a new listing any time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setToCancel(null)}>Keep listing</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmCancel}>
              <Trash2 className="h-4 w-4" /> Cancel listing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
