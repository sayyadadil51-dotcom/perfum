import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Handshake,
  Truck,
  Wallet,
  MessageCircle,
  Store,
  ArrowRight,
} from 'lucide-react';
import { DashboardShell, type DashNavItem } from '@/components/DashboardShell';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/context/AppStore';
import { formatWeight } from '@/lib/utils';

export default function BuyerLayout() {
  const { state, currentUser } = useAppStore();
  if (!currentUser) return null;

  const myOrders = state.orders.filter((o) => o.buyerId === currentUser.id);
  const myOffers = state.offers.filter((o) => o.buyerId === currentUser.id);
  const pendingApproval = currentUser.verificationStatus !== 'approved';

  const unread = state.messages.filter(
    (m) => m.threadId.includes(currentUser.id) && m.senderId !== currentUser.id && !m.readAt,
  ).length;

  const nav: DashNavItem[] = [
    { to: '/buyer', label: 'Browse scrap', icon: Search, end: true },
    { to: '/buyer/offers', label: 'My offers', icon: Handshake, badge: myOffers.filter((o) => o.status === 'pending').length },
    { to: '/buyer/orders', label: 'Orders', icon: Truck, badge: myOrders.filter((o) => ['accepted', 'pickup_scheduled'].includes(o.status)).length },
    { to: '/buyer/wallet', label: 'Wallet', icon: Wallet },
    { to: '/buyer/messages', label: 'Messages', icon: MessageCircle, badge: unread },
  ];

  const collected = myOrders
    .filter((o) => ['picked_up', 'paid'].includes(o.status))
    .reduce((a, o) => a + (o.finalWeightKg ?? o.declaredWeightKg), 0);

  return (
    <DashboardShell
      title="Dealer dashboard"
      subtitle={`${currentUser.businessName ?? 'Independent dealer'} · ${currentUser.city}`}
      nav={nav}
      actions={
        <Button asChild>
          <Link to="/buyer"><Search className="h-4 w-4" /> Find scrap</Link>
        </Button>
      }
      accent={
        pendingApproval ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Your dealer account is awaiting approval
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                  You can browse listings now. Offers unlock as soon as an admin verifies your business.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0">
              <Link to="/support">Upload documents <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <MiniStat label="Scrap collected" value={formatWeight(collected)} />
            <MiniStat label="Active offers" value={String(myOffers.filter((o) => o.status === 'pending').length)} />
            <MiniStat label="Open orders" value={String(myOrders.filter((o) => ['accepted', 'pickup_scheduled'].includes(o.status)).length)} />
            <MiniStat label="Wallet" value={`₹${(currentUser.walletBalance ?? 0).toLocaleString('en-IN')}`} />
          </div>
        )
      }
    />
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-sm">
      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate font-display text-sm font-bold">{value}</p>
    </div>
  );
}
