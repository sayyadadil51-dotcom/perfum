import * as React from 'react';
import { AlertTriangle, CheckCircle2, MessageSquare, Search, XCircle } from 'lucide-react';
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
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate, formatWeight, timeAgo } from '@/lib/utils';
import type { Dispute } from '@/lib/types';

export default function AdminDisputes() {
  const { state, resolveDispute, closeTicket } = useAppStore();
  const toast = useToast();
  const [tab, setTab] = React.useState('disputes');
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState<Dispute | null>(null);
  const [resolution, setResolution] = React.useState('');

  const disputes = state.disputes
    .filter((d) => !q.trim() || d.reason.toLowerCase().includes(q.toLowerCase()) || d.details.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = disputes.filter((d) => d.status === 'open');
  const closed = disputes.filter((d) => d.status !== 'open');

  const tickets = state.tickets.filter(
    (t) => !q.trim() || t.subject.toLowerCase().includes(q.toLowerCase()) || t.name.toLowerCase().includes(q.toLowerCase()),
  );

  const resolve = (status: 'resolved' | 'rejected') => {
    if (!active) return;
    if (!resolution.trim()) {
      toast.error('Add a resolution note');
      return;
    }
    const res = resolveDispute(active.id, resolution, status);
    if (!res.ok) return toast.error('Could not resolve', res.error);
    toast.success(status === 'resolved' ? 'Dispute resolved' : 'Dispute rejected');
    setActive(null);
    setResolution('');
  };

  const DisputeCard = ({ d }: { d: Dispute }) => {
    const order = state.orders.find((o) => o.id === d.orderId);
    const raised = state.users.find((u) => u.id === d.raisedBy);
    const against = state.users.find((u) => u.id === d.against);
    return (
      <li className="rounded-xl border border-border/70 p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold">{d.reason}</p>
              <StatusBadge status={d.status} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Order {order?.code} · {raised?.name} vs {against?.businessName ?? against?.name} · {timeAgo(d.createdAt)}
            </p>
          </div>
          {order && (
            <div className="text-right text-[11px] text-muted-foreground">
              <p>{formatWeight(order.finalWeightKg ?? order.declaredWeightKg)} · {formatCurrency(order.amount)}</p>
              <p>Collected {formatDate(order.pickedUpAt ?? order.createdAt)}</p>
            </div>
          )}
        </div>
        <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">{d.details}</p>
        {d.resolution && (
          <p className="mt-2 text-xs">
            <span className="font-semibold">Resolution: </span>
            {d.resolution}
          </p>
        )}
        {d.status === 'open' && (
          <div className="mt-2.5">
            <Button size="sm" onClick={() => { setActive(d); setResolution(''); }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Review & resolve
            </Button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        title="Disputes & support"
        description="Weight mismatches, no-shows and payment issues"
        action={<Badge variant="warning">{state.disputes.filter((d) => d.status === 'open').length} open</Badge>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search disputes…" className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="disputes"><AlertTriangle className="h-3.5 w-3.5" /> Disputes ({open.length})</TabsTrigger>
          <TabsTrigger value="closed"><CheckCircle2 className="h-3.5 w-3.5" /> Resolved ({closed.length})</TabsTrigger>
          <TabsTrigger value="tickets"><MessageSquare className="h-3.5 w-3.5" /> Tickets ({tickets.filter((t) => t.status === 'open').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes">
          {open.length ? <ul className="space-y-2.5">{open.map((d) => <DisputeCard key={d.id} d={d} />)}</ul> : (
            <EmptyState icon={CheckCircle2} title="No open disputes" description="Great — the marketplace is running smoothly." className="border-0 py-10" />
          )}
        </TabsContent>
        <TabsContent value="closed">
          {closed.length ? <ul className="space-y-2.5">{closed.map((d) => <DisputeCard key={d.id} d={d} />)}</ul> : (
            <EmptyState icon={CheckCircle2} title="Nothing resolved yet" description="Closed disputes are archived here." className="border-0 py-10" />
          )}
        </TabsContent>

        <TabsContent value="tickets">
          {tickets.length ? (
            <ul className="space-y-2.5">
              {tickets.map((t) => (
                <li key={t.id} className="rounded-xl border border-border/70 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{t.subject}</p>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {t.name} · +91 {t.phone} · {formatDate(t.createdAt)}
                      </p>
                    </div>
                    {t.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => { closeTicket(t.id); toast.success('Ticket closed'); }}>
                        Mark closed
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">{t.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={MessageSquare} title="No support tickets" description="Contact form submissions appear here." className="border-0 py-10" />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve dispute</DialogTitle>
            <DialogDescription>{active?.reason} — {active?.details}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="res">Resolution note</Label>
            <Textarea
              id="res"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="e.g. Weight re-verified from dealer's scale photo; ₹224 credited to the seller's wallet."
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setActive(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => resolve('rejected')}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button className="flex-1" onClick={() => resolve('resolved')}>
              <CheckCircle2 className="h-4 w-4" /> Resolve
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
