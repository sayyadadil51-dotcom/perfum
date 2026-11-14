import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, MapPin, Package, Search, Truck, Wallet } from 'lucide-react';
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

const SLOT_LABEL: Record<string, string> = {
  morning: '9 am – 12 pm',
  afternoon: '12 – 4 pm',
  evening: '4 – 7 pm',
};

export default function SellerOrders() {
  const { state, currentUser, lang } = useAppStore();
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('active');

  const orders = state.orders
    .filter((o) => o.sellerId === currentUser?.id)
    .filter((o) => {
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return o.code.toLowerCase().includes(s) || o.category.includes(s);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const groups = {
    active: orders.filter((o) => ['accepted', 'pickup_scheduled'].includes(o.status)),
    awaiting: orders.filter((o) => o.status === 'picked_up'),
    done: orders.filter((o) => ['paid', 'cancelled', 'disputed'].includes(o.status)),
  };

  const Card = ({ orderId }: { orderId: string }) => {
    const o = state.orders.find((x) => x.id === orderId)!;
    const buyer = state.users.find((u) => u.id === o.buyerId);
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
                {o.code} · {buyer?.businessName ?? buyer?.name} · {formatCurrency(o.agreedRate)}/kg
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
          <span className="inline-flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> {o.status === 'paid' ? `Paid ${o.paidAt ? timeAgo(o.paidAt) : ''}` : `Created ${timeAgo(o.createdAt)}`}
          </span>
          {o.paymentMode && (
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" /> {o.paymentMode === 'cash' ? 'Cash on pickup' : o.paymentMode.toUpperCase()}
            </span>
          )}
        </div>

        <StatusTimeline current={o.status} kind="order" className="mt-3" />

        <div className="mt-3 flex justify-end gap-2">
          {o.status === 'picked_up' && (
            <span className="mr-auto self-center rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              Awaiting payment from dealer
            </span>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link to={`/seller/orders/${o.id}`}>
              {o.status === 'picked_up' ? 'Confirm payment' : 'Details'} <ArrowRight className="h-3.5 w-3.5" />
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
      <PageHeader title="Orders & pickups" description={`${orders.length} order${orders.length === 1 ? '' : 's'} in total`} />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order code…" className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Upcoming ({groups.active.length})</TabsTrigger>
          <TabsTrigger value="awaiting">Awaiting payment ({groups.awaiting.length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({groups.done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {groups.active.length ? (
            <ul className="space-y-2.5">{groups.active.map((o) => <Card key={o.id} orderId={o.id} />)}</ul>
          ) : (
            <Empty title="No upcoming pickups" desc="Accept an offer on one of your listings to schedule a pickup." />
          )}
        </TabsContent>
        <TabsContent value="awaiting">
          {groups.awaiting.length ? (
            <ul className="space-y-2.5">{groups.awaiting.map((o) => <Card key={o.id} orderId={o.id} />)}</ul>
          ) : (
            <Empty title="Nothing awaiting payment" desc="Collected orders waiting for payment will appear here." />
          )}
        </TabsContent>
        <TabsContent value="done">
          {groups.done.length ? (
            <ul className="space-y-2.5">{groups.done.map((o) => <Card key={o.id} orderId={o.id} />)}</ul>
          ) : (
            <Empty title="No completed orders yet" desc="Paid and cancelled orders will be archived here." />
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Keep the scrap weighed, bagged and near your gate on the pickup day. Rescheduling is free up to 2
        hours before the slot.
      </div>
    </div>
  );
}
