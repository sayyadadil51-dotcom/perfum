import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  IndianRupee,
  Leaf,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard, StatCard, PageHeader } from '@/components/DashboardShell';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useAppStore } from '@/context/AppStore';
import { CATEGORY_MAP, co2Saved } from '@/data/categories';
import { collectionsSeries, signupSeries } from '@/data/seed';
import { formatCurrency, formatDate, formatWeight } from '@/lib/utils';

const PIE_COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#eab308', '#6366f1', '#84cc16', '#f97316'];

export default function AdminOverview() {
  const { state } = useAppStore();

  const paidOrders = state.orders.filter((o) => o.status === 'paid');
  const collectedKg = state.orders
    .filter((o) => ['picked_up', 'paid'].includes(o.status))
    .reduce((a, o) => a + (o.finalWeightKg ?? o.declaredWeightKg), 0);
  const revenue = Math.round(paidOrders.reduce((a, o) => a + o.amount, 0) * 0.015); // 1.5% commission
  const activeUsers = state.users.filter((u) => u.status === 'active').length;
  const sellers = state.users.filter((u) => u.role === 'seller');
  const buyers = state.users.filter((u) => u.role === 'buyer');
  const pendingBuyers = buyers.filter((b) => b.verificationStatus === 'pending');
  const co2 = state.orders
    .filter((o) => ['picked_up', 'paid'].includes(o.status))
    .reduce((a, o) => a + co2Saved(o.finalWeightKg ?? o.declaredWeightKg, o.category), 0);

  const collections = React.useMemo(() => collectionsSeries(14), []);
  const signups = React.useMemo(() => signupSeries(8), []);

  const categoryMix = React.useMemo(() => {
    const m = new Map<string, number>();
    state.orders
      .filter((o) => ['picked_up', 'paid'].includes(o.status))
      .forEach((o) => m.set(o.category, (m.get(o.category) ?? 0) + (o.finalWeightKg ?? o.declaredWeightKg)));
    return Array.from(m.entries())
      .map(([slug, kg]) => ({ name: CATEGORY_MAP[slug as keyof typeof CATEGORY_MAP]?.name ?? slug, slug, kg }))
      .sort((a, b) => b.kg - a.kg);
  }, [state.orders]);

  const recentOrders = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-4">
      <PageHeader title="Platform overview" description={`Last synced ${formatDate(new Date(), true)}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Scrap collected" value={formatWeight(collectedKg)} icon={PackageCheck} hint="All time" />
        <StatCard label="Commission revenue" value={formatCurrency(revenue)} icon={IndianRupee} tone="clay" trend={{ value: 12.4 }} />
        <StatCard label="Active users" value={String(activeUsers)} icon={Users} tone="sky" hint={`${sellers.length} sellers · ${buyers.length} dealers`} />
        <StatCard label="CO₂ avoided" value={`${formatWeight(co2)}`} icon={Leaf} tone="violet" hint="Estimated" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Daily collections" description="Kilograms collected per day" className="lg:col-span-2">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collections} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="kgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={44} />
                <ReTooltip
                  formatter={(v: number, n) => [n === 'kg' ? formatWeight(v) : formatCurrency(v), n === 'kg' ? 'Collected' : 'GMV']}
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="kg" stroke="#16a34a" strokeWidth={2.5} fill="url(#kgGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Category mix" description="By weight collected">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryMix} dataKey="kg" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={2}>
                  {categoryMix.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  formatter={(v: number) => formatWeight(v)}
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {categoryMix.map((c, i) => (
              <span key={c.slug} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {c.name}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="User growth" description="New signups per week">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signups} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={32} />
                <ReTooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sellers" name="Sellers" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="buyers" name="Dealers" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="GMV trend" description="Value transacted per day (₹)">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={collections} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `₹${v / 1000}k`} />
                <ReTooltip
                  formatter={(v: number) => [formatCurrency(v), 'GMV']}
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#c28142" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent orders"
          description="Latest activity across the marketplace"
          action={<Button size="sm" variant="ghost" asChild><Link to="/admin/disputes">Disputes <ArrowRight className="h-3.5 w-3.5" /></Link></Button>}
        >
          <ul className="divide-y divide-border/60">
            {recentOrders.map((o) => {
              const seller = state.users.find((u) => u.id === o.sellerId);
              const buyer = state.users.find((u) => u.id === o.buyerId);
              return (
                <li key={o.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
                  <CategoryIcon slug={o.category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      {o.code} · {seller?.name} → {buyer?.businessName ?? buyer?.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatWeight(o.finalWeightKg ?? o.declaredWeightKg)} · {formatCurrency(o.amount)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} withDot={false} />
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Pending dealer approvals"
          description="Verify business details before activating"
          action={<Button size="sm" variant="ghost" asChild><Link to="/admin/buyers">Review <ArrowRight className="h-3.5 w-3.5" /></Link></Button>}
        >
          {pendingBuyers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No pending applications 🎉</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {pendingBuyers.map((b) => (
                <li key={b.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{b.businessName}</p>
                    <p className="text-[10px] text-muted-foreground">{b.name} · {b.city} · {b.phone}</p>
                  </div>
                  <Badge variant="warning" className="text-[10px]">Pending</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total listings" value={String(state.listings.length)} icon={PackageCheck} />
        <StatCard label="Open offers" value={String(state.offers.filter((o) => o.status === 'pending').length)} icon={TrendingUp} tone="sky" />
        <StatCard label="Wallet liabilities" value={formatCurrency(state.users.reduce((a, u) => a + (u.walletBalance ?? 0), 0))} icon={Wallet} tone="clay" />
        <StatCard label="Avg. payout" value={formatCurrency(paidOrders.length ? paidOrders.reduce((a, o) => a + o.amount, 0) / paidOrders.length : 0)} icon={IndianRupee} tone="violet" />
      </div>
    </div>
  );
}
