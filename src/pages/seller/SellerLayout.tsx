import * as React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Plus,
  Receipt,
  Wallet,
  MessageCircle,
  Gift,
  Leaf,
  Sparkles,
  Truck,
  TrendingUp,
} from 'lucide-react';
import { DashboardShell, type DashNavItem } from '@/components/DashboardShell';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/context/AppStore';
import { co2Saved } from '@/data/categories';
import { formatCurrency, formatWeight } from '@/lib/utils';

export default function SellerLayout() {
  const { state, currentUser } = useAppStore();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const myListings = state.listings.filter((l) => l.sellerId === currentUser.id);
  const myOrders = state.orders.filter((o) => o.sellerId === currentUser.id);
  const earned = myOrders.filter((o) => o.status === 'paid').reduce((a, o) => a + o.amount, 0);
  const co2 = myOrders
    .filter((o) => ['picked_up', 'paid'].includes(o.status))
    .reduce((a, o) => a + co2Saved(o.finalWeightKg ?? o.declaredWeightKg, o.category), 0);
  const collectedKg = myOrders
    .filter((o) => ['picked_up', 'paid'].includes(o.status))
    .reduce((a, o) => a + (o.finalWeightKg ?? o.declaredWeightKg), 0);
  const unread = state.messages.filter(
    (m) =>
      m.threadId.includes(currentUser.id) &&
      m.senderId !== currentUser.id &&
      !m.readAt,
  ).length;

  const nav: DashNavItem[] = [
    { to: '/seller', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/seller/listings', label: 'My listings', icon: ListChecks, badge: myListings.filter((l) => l.status === 'listed').length },
    { to: '/seller/orders', label: 'Orders & pickups', icon: Truck, badge: myOrders.filter((o) => ['accepted', 'pickup_scheduled'].includes(o.status)).length },
    { to: '/seller/earnings', label: 'Earnings', icon: Wallet },
    { to: '/seller/messages', label: 'Messages', icon: MessageCircle, badge: unread },
    { to: '/seller/referrals', label: 'Rewards & referral', icon: Gift },
  ];

  return (
    <DashboardShell
      title="Seller dashboard"
      subtitle={`${currentUser.city}, ${currentUser.state}`}
      nav={nav}
      actions={
        <>
          <Button variant="outline" asChild className="hidden sm:inline-flex">
            <Link to="/rates"><TrendingUp className="h-4 w-4" /> Today's rates</Link>
          </Button>
          <Button asChild>
            <Link to="/seller/new"><Plus className="h-4 w-4" /> Sell scrap</Link>
          </Button>
        </>
      }
      accent={
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniStat label="Total earned" value={formatCurrency(earned)} icon={Wallet} />
          <MiniStat label="Active listings" value={String(myListings.filter((l) => ['listed', 'accepted', 'scheduled'].includes(l.status)).length)} icon={ListChecks} />
          <MiniStat label="Scrap recycled" value={formatWeight(collectedKg)} icon={Leaf} />
          <MiniStat label="CO₂ saved" value={formatWeight(co2)} icon={Sparkles} />
        </div>
      }
    />
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-sm">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-leaf-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-display text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}
