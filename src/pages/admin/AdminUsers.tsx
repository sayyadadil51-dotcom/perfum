import * as React from 'react';
import { Ban, CheckCircle2, Download, Search, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/DashboardShell';
import { StatusBadge, Stars } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Profile } from '@/lib/types';

export default function AdminUsers() {
  const { state, suspendUser, reactivateUser, approveBuyer } = useAppStore();
  const toast = useToast();
  const [q, setQ] = React.useState('');
  const [role, setRole] = React.useState('all');
  const [suspending, setSuspending] = React.useState<Profile | null>(null);
  const [reason, setReason] = React.useState('');

  const users = state.users
    .filter((u) => (role === 'all' ? true : u.role === role))
    .filter((u) => {
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return (
        u.name.toLowerCase().includes(s) ||
        u.phone.includes(s) ||
        (u.email ?? '').toLowerCase().includes(s) ||
        (u.businessName ?? '').toLowerCase().includes(s) ||
        u.referralCode.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const exportUsers = () => {
    const rows = [
      'ID,Name,Role,Phone,Email,City,Business,GSTIN,Verified,Status,Wallet,Points,Joined',
      ...users.map((u) =>
        [
          u.id, u.name, u.role, u.phone, u.email ?? '', u.city, u.businessName ?? '', u.gstin ?? '',
          u.verificationStatus ?? '', u.status, u.walletBalance ?? 0, u.rewardPoints ?? 0, u.createdAt.slice(0, 10),
        ].join(','),
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scrapkart-users.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doSuspend = () => {
    if (!suspending) return;
    const res = suspendUser(suspending.id, reason || 'Suspended by admin');
    if (!res.ok) return toast.error('Could not suspend', res.error);
    toast.info('User suspended');
    setSuspending(null);
    setReason('');
  };

  return (
    <div>
      <PageHeader
        title="All users"
        description={`${state.users.length} accounts on ScrapKart`}
        action={
          <Button size="sm" variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, GSTIN…" className="pl-9" />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="seller">Sellers</SelectItem>
            <SelectItem value="buyer">Dealers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users match" description="Try a different search or role filter." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">User</th>
                  <th className="px-4 py-2.5 font-semibold">Role</th>
                  <th className="px-4 py-2.5 font-semibold">Verified</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Wallet</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Joined</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{u.businessName ?? u.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {u.name} · {u.phone} · {u.city}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'clay' : u.role === 'buyer' ? 'info' : 'default'} className="capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.verificationStatus ?? 'none'} withDot={false} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} withDot={false} />
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(u.walletBalance ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-[11px] text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {u.role === 'buyer' && u.verificationStatus === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => { approveBuyer(u.id); toast.success('Dealer approved'); }}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </Button>
                        )}
                        {u.status === 'active' ? (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setSuspending(u)}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => { reactivateUser(u.id); toast.success('User reactivated'); }}>
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border/60 lg:hidden">
            {users.map((u) => (
              <li key={u.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.businessName ?? u.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{u.name} · {u.phone}</p>
                  </div>
                  <Badge variant={u.role === 'admin' ? 'clay' : u.role === 'buyer' ? 'info' : 'default'} className="capitalize">{u.role}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={u.verificationStatus ?? 'none'} withDot={false} />
                  <StatusBadge status={u.status} withDot={false} />
                  <span className="ml-auto text-[11px] text-muted-foreground">{formatCurrency(u.walletBalance ?? 0)}</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {u.role === 'buyer' && u.verificationStatus === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => { approveBuyer(u.id); toast.success('Dealer approved'); }}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {u.status === 'active' ? (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setSuspending(u)}>
                      <Ban className="h-3.5 w-3.5" /> Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => { reactivateUser(u.id); toast.success('User reactivated'); }}>
                      <UserCheck className="h-3.5 w-3.5" /> Reactivate
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!suspending} onOpenChange={(o) => !o && setSuspending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend this account?</DialogTitle>
            <DialogDescription>
              {suspending?.name} will be signed out and cannot list or bid until reactivated. Open orders
              still need to be settled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason (shown to the user)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Repeated no-shows on scheduled pickups" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSuspending(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={doSuspend}>Suspend account</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Suspensions are logged. Users can appeal through support, and admins can reactivate from this page.
      </div>
    </div>
  );
}
