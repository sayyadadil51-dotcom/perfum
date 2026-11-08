import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownToLine, Banknote, CreditCard, Download, IndianRupee, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard, StatCard, PageHeader } from '@/components/DashboardShell';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { categoryName } from '@/data/categories';
import { formatCurrency, formatDate, formatWeight } from '@/lib/utils';

export default function SellerEarnings() {
  const { state, currentUser, lang } = useAppStore();
  const myOrders = state.orders.filter((o) => o.sellerId === currentUser?.id);
  const paid = myOrders.filter((o) => o.status === 'paid');
  const payments = state.payments.filter((p) => p.userId === currentUser?.id);
  const pending = myOrders.filter((o) => o.status === 'picked_up');
  const total = paid.reduce((a, o) => a + o.amount, 0);
  const pendingAmt = pending.reduce((a, o) => a + o.amount, 0);
  const avg = paid.length ? total / paid.length : 0;
  const kg = paid.reduce((a, o) => a + (o.finalWeightKg ?? o.declaredWeightKg), 0);

  // Group by month for the bar chart
  const byMonth = React.useMemo(() => {
    const map = new Map<string, { label: string; amount: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      map.set(d.toISOString().slice(0, 7), { label: d.toLocaleDateString('en-IN', { month: 'short' }), amount: 0 });
    }
    paid.forEach((o) => {
      const key = (o.paidAt ?? o.createdAt).slice(0, 7);
      const rec = map.get(key);
      if (rec) rec.amount += o.amount;
    });
    return Array.from(map.values());
  }, [paid]);

  const exportStatement = () => {
    const rows = [
      'Order,Date,Category,Rate/kg,Weight kg,Amount,Mode',
      ...paid.map((o) =>
        [
          o.code,
          (o.paidAt ?? o.createdAt).slice(0, 10),
          categoryName(o.category, 'en'),
          o.agreedRate,
          o.finalWeightKg ?? o.declaredWeightKg,
          o.amount,
          o.paymentMode ?? '',
        ].join(','),
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scrapkart-earnings.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Earnings"
        description="Every completed pickup and its payout"
        action={
          <Button size="sm" variant="outline" onClick={exportStatement}>
            <Download className="h-4 w-4" /> Export statement
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Lifetime earnings" value={formatCurrency(total)} icon={Wallet} hint={`${paid.length} pickups`} />
        <StatCard label="Pending" value={formatCurrency(pendingAmt)} icon={ArrowDownToLine} tone="clay" hint={`${pending.length} awaiting payment`} />
        <StatCard label="Average pickup" value={formatCurrency(avg)} icon={IndianRupee} tone="sky" hint={`${formatWeight(kg)} sold`} />
        <StatCard
          label="Reward points"
          value={String(currentUser?.rewardPoints ?? 0)}
          icon={Smartphone}
          tone="violet"
          hint={`≈ ${formatCurrency((currentUser?.rewardPoints ?? 0) / 4)} value`}
        />
      </div>

      <SectionCard title="Monthly earnings" description="Paid pickups, last 6 months">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMonth} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `₹${v / 1000}k`} />
              <ReTooltip
                formatter={(v: number) => [formatCurrency(v), 'Earned']}
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }}
              />
              <Bar dataKey="amount" fill="#16a34a" radius={[8, 8, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Payout history" description="Recent successful payments">
          {payments.length === 0 ? (
            <EmptyState icon={Wallet} title="No payouts yet" description="Your first payout appears once a pickup completes." className="border-0 py-8" />
          ) : (
            <ul className="divide-y divide-border/60">
              {payments.slice(0, 8).map((p) => {
                const order = state.orders.find((o) => o.id === p.orderId);
                const Icon = p.mode === 'upi' ? Smartphone : p.mode === 'cash' ? Banknote : CreditCard;
                return (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-leaf-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{order?.code ?? 'Order'} · {p.mode.toUpperCase()}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(p.createdAt, true)} · {p.reference}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(p.amount)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Awaiting payment" description="Collected but not yet settled">
          {pending.length === 0 ? (
            <EmptyState icon={IndianRupee} title="Nothing pending" description="All completed pickups have been paid." className="border-0 py-8" />
          ) : (
            <ul className="divide-y divide-border/60">
              {pending.map((o) => {
                const buyer = state.users.find((u) => u.id === o.buyerId);
                return (
                  <li key={o.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <CategoryIcon slug={o.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.code} · {buyer?.businessName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatWeight(o.finalWeightKg ?? o.declaredWeightKg)} · collected {formatDate(o.pickedUpAt ?? o.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(o.amount)}</p>
                      <Link to={`/seller/orders/${o.id}`} className="text-[11px] font-medium text-primary hover:underline">
                        View order
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="All completed pickups" description="Full transaction history">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr className="border-b border-border">
                <th className="pb-2 font-semibold">Order</th>
                <th className="pb-2 font-semibold">Category</th>
                <th className="pb-2 text-right font-semibold">Weight</th>
                <th className="pb-2 text-right font-semibold">Rate</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paid.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="py-2.5">
                    <Link to={`/seller/orders/${o.id}`} className="font-medium hover:text-primary">{o.code}</Link>
                    <p className="text-[11px] text-muted-foreground">{formatDate(o.paidAt ?? o.createdAt)}</p>
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <CategoryIcon slug={o.category} size="sm" withTile={false} className="text-muted-foreground" />
                      {categoryName(o.category, lang)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">{formatWeight(o.finalWeightKg ?? o.declaredWeightKg)}</td>
                  <td className="py-2.5 text-right">{formatCurrency(o.agreedRate)}</td>
                  <td className="py-2.5 text-right font-semibold">{formatCurrency(o.amount)}</td>
                  <td className="py-2.5 text-right"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!paid.length && <p className="py-8 text-center text-sm text-muted-foreground">No completed pickups yet.</p>}
        </div>
      </SectionCard>
    </div>
  );
}
