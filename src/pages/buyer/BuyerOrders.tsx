import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Search, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/DashboardShell';
import { StatusBadge, StatusTimeline } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { categoryName } from '@/data/categories';
import { formatCurrency, formatDate, formatWeight, timeAgo } from '@/lib/utils';

const SLOT_LABEL: Record<string, string> = { morning: '9 am – 12 pm', afternoon: '12 – 4 pm', evening: '4 – 7 pm' };

export default function BuyerOrders() {
  const { state, currentUser, lang } = useAppStore();
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('active');

  const orders = state.orders
    .filter((o) => o.buyerId === currentUser?.id)
    .filter((o) => {
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return o.code.toLowerCase().includes(s) || o.category.includes(s);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const groups = {
    active: orders.filter((o) => ['accepted', 'pickup_scheduled'].includes(o.status)),
    payable: orders.filter((o) => o.status === 'picked_up'),
    done: orders.filter((o) => ['paid', 'cancelled', 'disputed'].includes(o.status)),
  };

  const Card = ({ id }: { id: string }) => {
    const o = state.orders.find((x) => x.id === id)!;
    const seller = state.users.find((u) => u.id === o.sellerId);
    const listing = state.listings.find((l) => l.id === o.listingId);
    return (
      <li className="rounded-xl border border-border/70 p-3.5 transition hover:border-primary/30">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <CategoryIcon slug={o.category} size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{listing?.title ?? categoryName(o.category, lang)}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {o.code} · {seller?.name} · {formatCurrency(o.agreedRate)}/kg
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-sm font-bold text-primary">{formatCurrency(o.amount)}</p>
            <p className="text-[10px] text-muted-foreground">
              {o.finalWeightKg ? `${formatWeight(o.finalWeightKg)} final` : `${formatWeight(o.declaredWeightKg)} est.`}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" /> {formatDate(o.pickupDate)} · {SLOT_LABEL[o.pickupSlot]}
          </span>
          <span>Created {timeAgo(o.createdAt)}</span>
        </div>

        <StatusTimeline current={o.status} kind="order" className="mt-3" />

        <div className="mt-3 flex justify-end gap-2">
          {o.status === 'picked_up' && (
            <span className="mr-auto self-center rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              Payment due
            </span>
          )}
          <Button size="sm" asChild>
            <Link to={`/buyer/orders/${o.id}`}>
              {o.status === 'picked_up' ? 'Pay now' : 'Details'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </li>
    );
  };

  const Empty = ({ title, desc }: { title: string; desc: string }) => (
    <EmptyState icon={Truck} title={title} description={desc} className="border-0 py-10" />
  );

  return (
    <div>
      <PageHeader title="My orders" description={`${orders.length} order${orders.length === 1 ? '' : 's'}`} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order code…" className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">In progress ({groups.active.length})</TabsTrigger>
          <TabsTrigger value="payable">Payment due ({groups.payable.length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({groups.done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {groups.active.length ? <ul className="space-y-2.5">{groups.active.map((o) => <Card key={o.id} id={o.id} />)}</ul> : <Empty title="No pickups in progress" desc="Accept a listing to create your first order." />}
        </TabsContent>
        <TabsContent value="payable">
          {groups.payable.length ? <ul className="space-y-2.5">{groups.payable.map((o) => <Card key={o.id} id={o.id} />)}</ul> : <Empty title="No payments due" desc="Collected lots waiting to be paid appear here." />}
        </TabsContent>
        <TabsContent value="done">
          {groups.done.length ? <ul className="space-y-2.5">{groups.done.map((o) => <Card key={o.id} id={o.id} />)}</ul> : <Empty title="No completed orders" desc="Settled and cancelled orders are archived here." />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
