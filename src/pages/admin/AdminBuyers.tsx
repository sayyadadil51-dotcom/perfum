import * as React from 'react';
import {
  Building2,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function AdminBuyers() {
  const { state, approveBuyer, rejectBuyer } = useAppStore();
  const toast = useToast();
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('pending');
  const [rejecting, setRejecting] = React.useState<Profile | null>(null);
  const [reason, setReason] = React.useState('');

  const buyers = state.users
    .filter((u) => u.role === 'buyer')
    .filter((u) => {
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return (
        (u.businessName ?? '').toLowerCase().includes(s) ||
        u.name.toLowerCase().includes(s) ||
        u.phone.includes(s) ||
        u.city.toLowerCase().includes(s)
      );
    });

  const groups = {
    pending: buyers.filter((b) => b.verificationStatus === 'pending'),
    approved: buyers.filter((b) => b.verificationStatus === 'approved'),
    rejected: buyers.filter((b) => b.verificationStatus === 'rejected'),
  };

  const approve = (b: Profile) => {
    const res = approveBuyer(b.id);
    if (!res.ok) return toast.error('Could not approve', res.error);
    toast.success('Dealer approved', `${b.businessName} can now send offers.`);
  };

  const doReject = () => {
    if (!rejecting) return;
    const res = rejectBuyer(rejecting.id, reason || 'Business documents could not be verified.');
    if (!res.ok) return toast.error('Could not reject', res.error);
    toast.info('Application rejected');
    setRejecting(null);
    setReason('');
  };

  const BuyerCard = ({ b, showActions }: { b: Profile; showActions?: boolean }) => {
    const orders = state.orders.filter((o) => o.buyerId === b.id);
    const spent = orders.filter((o) => o.status === 'paid').reduce((a, o) => a + o.amount, 0);
    return (
      <li className="rounded-xl border border-border/70 p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-leaf-700">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{b.businessName ?? b.name}</p>
                <StatusBadge status={b.verificationStatus ?? 'none'} />
                {b.status === 'suspended' && <Badge variant="danger" className="text-[10px]">Suspended</Badge>}
              </div>
              <p className="truncate text-xs text-muted-foreground">{b.name} · {b.phone}</p>
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p>{orders.length} orders · {formatCurrency(spent)}</p>
            <div className="flex items-center justify-end gap-1">
              <Stars value={Math.round(b.rating ?? 0)} size="sm" /> {b.rating?.toFixed(1) ?? 'New'}
            </div>
          </div>
        </div>

        <dl className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">GSTIN</dt>
            <dd className="font-medium">{b.gstin ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Service areas</dt>
            <dd className="font-medium">{b.serviceAreas?.join(', ') || b.city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Applied</dt>
            <dd className="font-medium">{formatDate(b.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-medium">{b.email ?? '—'}</dd>
          </div>
        </dl>

        {showActions && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => approve(b)}>
              <Check className="h-3.5 w-3.5" /> Approve dealer
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRejecting(b)}>
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={`tel:+91${b.phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>
            </Button>
            {b.email && (
              <Button size="sm" variant="ghost" asChild>
                <a href={`mailto:${b.email}`}><Mail className="h-3.5 w-3.5" /> Email</a>
              </Button>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        title="Buyer approvals"
        description="Verify dealer businesses before they can bid"
        action={<Badge variant="warning">{groups.pending.length} pending</Badge>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business, name or city…" className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({groups.approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({groups.rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {groups.pending.length ? (
            <ul className="space-y-2.5">{groups.pending.map((b) => <BuyerCard key={b.id} b={b} showActions />)}</ul>
          ) : (
            <EmptyState icon={ShieldCheck} title="No pending applications" description="New dealer registrations will appear here for review." className="border-0 py-10" />
          )}
        </TabsContent>
        <TabsContent value="approved">
          {groups.approved.length ? (
            <ul className="space-y-2.5">{groups.approved.map((b) => <BuyerCard key={b.id} b={b} />)}</ul>
          ) : (
            <EmptyState icon={ShieldCheck} title="No approved dealers yet" description="Approved dealers can browse and bid." className="border-0 py-10" />
          )}
        </TabsContent>
        <TabsContent value="rejected">
          {groups.rejected.length ? (
            <ul className="space-y-2.5">{groups.rejected.map((b) => <BuyerCard key={b.id} b={b} />)}</ul>
          ) : (
            <EmptyState icon={ShieldCheck} title="No rejected applications" description="Rejected applications are archived here." className="border-0 py-10" />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this application?</DialogTitle>
            <DialogDescription>
              {rejecting?.businessName} will be notified with your reason and cannot bid until they
              re-apply.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. GSTIN not matching the business name on the shop licence"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={doReject}>Reject application</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Verification checklist: business name matches GST records, service area is within a 60 km radius of
        the city, at least one working phone number, and no active disputes on previous accounts.
        <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0" />
      </div>
    </div>
  );
}
