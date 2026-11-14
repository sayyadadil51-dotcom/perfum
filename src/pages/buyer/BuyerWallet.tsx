import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Download,
  IndianRupee,
  Smartphone,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard, StatCard, PageHeader } from '@/components/DashboardShell';
import { EmptyState, Progress } from '@/components/ui/misc';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { categoryName } from '@/data/categories';
import { downloadFile, formatCurrency, formatDate, formatWeight } from '@/lib/utils';

export default function BuyerWallet() {
  const { state, currentUser, lang } = useAppStore();
  const toast = useToast();
  const myOrders = state.orders.filter((o) => o.buyerId === currentUser?.id);
  const paidOrders = myOrders.filter((o) => o.status === 'paid');
  const spent = paidOrders.reduce((a, o) => a + o.amount, 0);
  const due = myOrders.filter((o) => o.status === 'picked_up').reduce((a, o) => a + o.amount, 0);
  const kg = myOrders
    .filter((o) => ['picked_up', 'paid'].includes(o.status))
    .reduce((a, o) => a + (o.finalWeightKg ?? o.declaredWeightKg), 0);

  const monthly = React.useMemo(() => {
    const map = new Map<string, { label: string; spend: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      map.set(d.toISOString().slice(0, 7), { label: d.toLocaleDateString('en-IN', { month: 'short' }), spend: 0 });
    }
    paidOrders.forEach((o) => {
      const rec = map.get((o.paidAt ?? o.createdAt).slice(0, 7));
      if (rec) rec.spend += o.amount;
    });
    return Array.from(map.values());
  }, [paidOrders]);

  const payments = state.payments.filter((p) => paidOrders.some((o) => o.id === p.orderId));

  const statement = () => {
    const rows = [
      'Order,Date,Category,Weight kg,Amount,Mode,Reference',
      ...payments.map((p) => {
        const o = state.orders.find((x) => x.id === p.orderId)!;
        return [o.code, p.createdAt.slice(0, 10), categoryName(o.category, 'en'), o.finalWeightKg ?? o.declaredWeightKg, p.amount, p.mode, p.reference].join(',');
      }),
    ].join('\n');
    if (downloadFile('scrapkart-wallet-statement.csv', rows, 'text/csv;charset=utf-8'))
      toast.success('Statement downloaded');
    else toast.error('Download blocked', 'Please allow downloads for this site and try again.');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Wallet & payments"
        description="Purchases, dues and payment history"
        action={
          <Button size="sm" variant="outline" onClick={statement}>
            <Download className="h-4 w-4" /> Statement
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Wallet balance" value={formatCurrency(currentUser?.walletBalance ?? 0)} icon={Wallet} hint="Available credit" />
        <StatCard label="Total spent" value={formatCurrency(spent)} icon={ArrowUpRight} tone="clay" hint={`${paidOrders.length} purchases`} />
        <StatCard label="Payment due" value={formatCurrency(due)} icon={ArrowDownLeft} tone="violet" hint="Collected but unpaid" />
        <StatCard label="Scrap purchased" value={formatWeight(kg)} icon={IndianRupee} tone="sky" hint="All time" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Spending trend" description="Paid purchases, last 6 months">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `₹${v / 1000}k`} />
                <ReTooltip
                  formatter={(v: number) => [formatCurrency(v), 'Spent']}
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="spend" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#spendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Credit line" description="Pre-approved buying limit">
          <p className="font-display text-3xl font-extrabold text-primary">{formatCurrency(100000)}</p>
          <p className="text-xs text-muted-foreground">Limit based on your verification tier and history</p>
          <Progress value={Math.min(100, (due / 100000) * 100)} className="mt-3" />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {formatCurrency(due)} of {formatCurrency(100000)} in use
          </p>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-2">
              <span className="text-muted-foreground">Commission rate</span>
              <Badge variant="success">1.5% per deal</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-2">
              <span className="text-muted-foreground">Payment terms</span>
              <span className="font-medium">Pay on pickup</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-2">
              <span className="text-muted-foreground">Settlement cycle</span>
              <span className="font-medium">Instant (UPI)</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Payment history" description="All completed transactions">
        {payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments yet" description="Your purchases will be listed here with receipts." className="border-0 py-8" />
        ) : (
          <ul className="divide-y divide-border/60">
            {payments.map((p) => {
              const o = state.orders.find((x) => x.id === p.orderId)!;
              const Icon = p.mode === 'upi' ? Smartphone : p.mode === 'cash' ? Banknote : CreditCard;
              return (
                <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-leaf-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {o.code} · {categoryName(o.category, lang)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(p.createdAt, true)} · {p.reference} · {formatWeight(o.finalWeightKg ?? o.declaredWeightKg)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">−{formatCurrency(p.amount)}</p>
                    <Link to={`/buyer/orders/${o.id}`} className="text-[10px] text-primary hover:underline">View</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Outstanding dues" description="Lots you have collected but not yet paid for">
        {myOrders.filter((o) => o.status === 'picked_up').length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">All settled — nice work 🌿</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {myOrders.filter((o) => o.status === 'picked_up').map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <CategoryIcon slug={o.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.code} · {categoryName(o.category, lang)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatWeight(o.finalWeightKg ?? o.declaredWeightKg)} collected {formatDate(o.pickedUpAt ?? o.createdAt)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(o.amount)}</p>
                <Button size="sm" asChild>
                  <Link to={`/buyer/orders/${o.id}`}>Pay</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
