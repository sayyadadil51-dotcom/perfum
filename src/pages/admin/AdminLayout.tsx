import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  IndianRupee,
  ListChecks,
  AlertTriangle,
  LifeBuoy,
  Tags,
  RotateCcw,
  Download,
} from 'lucide-react';
import { DashboardShell, type DashNavItem } from '@/components/DashboardShell';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';

export default function AdminLayout() {
  const { state, currentUser, resetDemo } = useAppStore();
  const toast = useToast();
  if (!currentUser) return null;

  const pendingBuyers = state.users.filter((u) => u.role === 'buyer' && u.verificationStatus === 'pending');
  const openDisputes = state.disputes.filter((d) => d.status === 'open');
  const openTickets = state.tickets.filter((t) => t.status === 'open');

  const nav: DashNavItem[] = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/buyers', label: 'Buyer approvals', icon: ShieldCheck, badge: pendingBuyers.length },
    { to: '/admin/rates', label: 'Scrap rates', icon: IndianRupee },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/users', label: 'All users', icon: Users },
    { to: '/admin/listings', label: 'All listings', icon: ListChecks },
    { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, badge: openDisputes.length },
    { to: '/admin/support', label: 'Support', icon: LifeBuoy, badge: openTickets.length },
  ];

  const exportAll = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      users: state.users.map(({ password, ...u }) => u),
      listings: state.listings,
      orders: state.orders,
      offers: state.offers,
      rates: state.rates.map(({ history, ...r }) => r),
      disputes: state.disputes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scrapkart-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Export downloaded');
  };

  return (
    <DashboardShell
      title="Admin panel"
      subtitle="ScrapKart operations · Nagpur region"
      nav={nav}
      actions={
        <>
          <Button variant="outline" onClick={exportAll}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="ghost" onClick={() => { resetDemo(); toast.info('Demo data reset', 'All changes were cleared.'); }}>
            <RotateCcw className="h-4 w-4" /> Reset demo
          </Button>
        </>
      }
      accent={
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniStat label="Pending approvals" value={String(pendingBuyers.length)} tone="amber" />
          <MiniStat label="Open disputes" value={String(openDisputes.length)} tone="red" />
          <MiniStat label="Open tickets" value={String(openTickets.length)} tone="sky" />
          <MiniStat label="Live listings" value={String(state.listings.filter((l) => l.status === 'listed').length)} tone="green" />
        </div>
      }
    />
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'red' | 'sky' | 'green' }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200',
    red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200',
    sky: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200',
  };
  return (
    <div className={`rounded-xl border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="font-display text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}
