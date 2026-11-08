import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Inbox,
  IndianRupee,
  Leaf,
  ListChecks,
  PackageOpen,
  Plus,
  Scale,
  Sparkles,
  Star,
  Truck,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, SectionCard, PageHeader } from '@/components/DashboardShell';
import { StatusBadge, StatusTimeline, Stars } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { CATEGORY_MAP, co2Saved } from '@/data/categories';
import { cn, formatCurrency, formatDate, formatWeight, timeAgo } from '@/lib/utils';

export default function SellerDashboard() {
  const { state, currentUser } = useAppStore();
  if (!currentUser) return null;

  const myListings = state.listings.filter((l) => l.sellerId === currentUser.id);
  const myOrders = state.orders.filter((o) => o.sellerId === currentUser.id);
  const paidOrders = myOrders.filter((o) => o.status === 'paid');
  const earned = paidOrders.reduce((a, o) => a + o.amount, 0);
  const collectedKg = myOrders
    .filter((o) => ['picked_up', 'paid'].includes(o.status))
    .reduce((a, o) => a + (o.finalWeightKg ?? o.declaredWeightKg), 0);
  const co2 = myOrders
    .filter((o) => ['picked_up', 'paid'].includes(o.status))
    .reduce((a, o) => a + co2Saved(o.finalWeightKg ?? o.declaredWeightKg, o.category), 0);
  const pendingOffers = state.offers.filter((o) => o.sellerId === currentUser.id && o.status === 'pending');
  const upcoming = myOrders
    .filter((o) => ['accepted', 'pickup_scheduled'].includes(o.status))
    .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate));
  const activeListings = myListings.filter((l) => ['listed', 'accepted', 'scheduled'].includes(l.status));

  /* Earnings trend — last 6 months of paid orders (seeded history included). */
  const monthly = React.useMemo(() => {
    const buckets = new Map<string, { label: string; amount: number; kg: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      buckets.set(d.toISOString().slice(0, 7), {
        label: d.toLocaleDateString('en-IN', { month: 'short' }),
        amount: 0,
        kg: 0,
      });
    }
    paidOrders.forEach((o) => {
      const key = (o.paidAt ?? o.createdAt).slice(0, 7);
      const b = buckets.get(key);
      if (b) {
        b.amount += o.amount;
        b.kg += o.finalWeightKg ?? o.declaredWeightKg;
      }
    });
    return Array.from(buckets.values());
  }, [paidOrders]);

  /* Category mix for the donut. */
  const mix = React.useMemo(() => {
    const m = new Map<string, number>();
    myOrders
      .filter((o) => ['picked_up', 'paid'].includes(o.status))
      .forEach((o) => m.set(o.category, (m.get(o.category) ?? 0) + (o.finalWeightKg ?? o.declaredWeightKg)));
    return Array.from(m.entries())
      .map(([slug, kg]) => ({ name: CATEGORY_MAP[slug as keyof typeof CATEGORY_MAP]?.name ?? slug, kg }))
      .sort((a, b) => b.kg - a.kg);
  }, [myOrders]);

  const PIE_COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

  const notifications = state.notifications.filter((n) => n.userId === currentUser.id).slice(0, 4);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total earned" value={formatCurrency(earned)} icon={Wallet} hint={`${paidOrders.length} paid pickups`} />
        <StatCard label="Scrap sold" value={formatWeight(collectedKg)} icon={Scale} tone="sky" hint="All time" />
        <StatCard label="CO₂ saved" value={`${co2.toFixed(1)} kg`} icon={Leaf} tone="violet" hint="≈ estimate" />
        <StatCard
          label="Pending offers"
          value={String(pendingOffers.length)}
          icon={Inbox}
          tone="clay"
          hint={pendingOffers.length ? 'Action needed' : 'All caught up'}
        />
      </div>

      {/* Quick action banner */}
      {myListings.length === 0 && (
        <div className="overflow-hidden rounded-2xl gradient-leaf p-6 text-white">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Let's get your first listing live</h2>
              <p className="mt-1 text-sm text-white/80">
                List in under 2 minutes and get offers from verified dealers today.
              </p>
            </div>
            <Button variant="white" asChild>
              <Link to="/seller/new"><Plus className="h-4 w-4" /> Sell scrap</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Earnings chart */}
        <SectionCard
          title="Earnings trend"
          description="Paid pickups over the last 6 months"
          className="lg:col-span-2"
          action={<Badge variant="success"><IndianRupee className="h-3 w-3" /> {formatCurrency(monthly.reduce((a, m) => a + m.amount, 0))}</Badge>}
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="earnGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `₹${v / 1000}k`} />
                <ReTooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    fontSize: 12,
                  }}
                  formatter={(value: number, name) => [name === 'amount' ? formatCurrency(value) : formatWeight(value), name === 'amount' ? 'Earned' : 'Weight']}
                />
                <Area type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2.5} fill="url(#earnGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Category mix */}
        <SectionCard title="What you recycle" description="By weight sold">
          {mix.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mix} dataKey="kg" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                    {mix.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip
                    formatter={(v: number) => formatWeight(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {mix.map((m, i) => (
                  <li key={m.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {m.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState icon={PackageOpen} title="No pickups yet" description="Completed pickups will appear here." className="border-0 py-8" />
          )}
        </SectionCard>
      </div>

      {/* Offers needing action */}
      <SectionCard
        title="Offers waiting on you"
        description="Accept the best price or send a counter offer"
        action={
          pendingOffers.length > 0 ? (
            <Badge variant="warning">{pendingOffers.length} pending</Badge>
          ) : undefined
        }
      >
        {pendingOffers.length === 0 ? (
          <EmptyState icon={Inbox} title="No pending offers" description="New dealer offers will show up here instantly." className="border-0 py-8" />
        ) : (
          <ul className="divide-y divide-border/60">
            {pendingOffers.slice(0, 4).map((o) => {
              const listing = state.listings.find((l) => l.id === o.listingId);
              const buyer = state.users.find((u) => u.id === o.buyerId);
              if (!listing) return null;
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <CategoryIcon slug={listing.category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{listing.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {buyer?.businessName ?? buyer?.name} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-primary">{formatCurrency(o.ratePerKg)}/kg</p>
                    <p className="text-[11px] text-muted-foreground">≈ {formatCurrency(o.amount)}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/seller/listings/${listing.id}`}>
                      Review <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* Upcoming pickups */}
      <SectionCard
        title="Upcoming pickups"
        description="Keep the scrap ready and accessible"
        action={<Button size="sm" variant="ghost" asChild><Link to="/seller/orders">All orders <ArrowRight className="h-3.5 w-3.5" /></Link></Button>}
      >
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No pickups scheduled" description="Once you accept an offer, schedule the pickup slot here." className="border-0 py-8" />
        ) : (
          <ul className="space-y-3">
            {upcoming.slice(0, 3).map((o) => {
              const buyer = state.users.find((u) => u.id === o.buyerId);
              return (
                <li key={o.id} className="rounded-xl border border-border/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon slug={o.category} size="sm" />
                      <div>
                        <p className="text-sm font-semibold">
                          {CATEGORY_MAP[o.category]?.name} · {o.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {buyer?.businessName ?? buyer?.name} · {formatDate(o.pickupDate)} ·{' '}
                          {o.pickupSlot === 'morning' ? '9 am – 12 pm' : o.pickupSlot === 'afternoon' ? '12 – 4 pm' : '4 – 7 pm'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <StatusTimeline current={o.status} kind="order" className="mt-3" />
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active listings */}
        <SectionCard
          title="Active listings"
          className="lg:col-span-2"
          action={<Button size="sm" variant="ghost" asChild><Link to="/seller/listings">Manage <ChevronRight className="h-3.5 w-3.5" /></Link></Button>}
        >
          {activeListings.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No active listings"
              description="List your scrap and start receiving offers from verified dealers."
              action={<Button asChild><Link to="/seller/new"><Plus className="h-4 w-4" /> Sell scrap</Link></Button>}
              className="border-0 py-8"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeListings.slice(0, 2).map((l) => (
                <ListingCard key={l.id} listing={l} href={`/seller/listings/${l.id}`} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Activity + trust */}
        <div className="space-y-4">
          <SectionCard title="Recent activity">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Bell className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-snug">{n.title}</p>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">{n.body}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <Star className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Your rating</p>
                <div className="flex items-center gap-1.5">
                  <Stars value={Math.round(currentUser.rating ?? 0)} />
                  <span className="text-sm font-bold">{currentUser.rating ?? '—'}</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Sellers with clear photos and accurate weights get 2× more offers. Keep listings updated.
            </p>
            <Button size="sm" variant="secondary" className="mt-3 w-full" asChild>
              <Link to="/profile">Improve my profile</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Impact strip */}
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">You've saved approximately {co2.toFixed(1)} kg of CO₂</p>
            <p className="text-xs text-muted-foreground">
              That's like planting {Math.max(1, Math.round(co2 / 21))} trees 🌳 — computed from your {formatWeight(collectedKg)} of recycled scrap.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/how-it-works#impact">How we calculate</Link>
        </Button>
      </div>
    </div>
  );
}
