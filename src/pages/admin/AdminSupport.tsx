import * as React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Mail, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard, PageHeader, StatCard } from '@/components/DashboardShell';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

export default function AdminSupport() {
  const { state, closeTicket } = useAppStore();
  const toast = useToast();
  const tickets = [...state.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = tickets.filter((t) => t.status === 'open');

  return (
    <div className="space-y-4">
      <PageHeader title="Support inbox" description="Contact form submissions and reported issues" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open tickets" value={String(open.length)} icon={LifeBuoy} tone="clay" />
        <StatCard label="Closed" value={String(tickets.length - open.length)} icon={MessageSquare} tone="sky" />
        <StatCard label="Open disputes" value={String(state.disputes.filter((d) => d.status === 'open').length)} icon={MessageSquare} tone="violet" />
        <StatCard label="Avg. response" value="3h 20m" icon={LifeBuoy} hint="Last 30 days" />
      </div>

      <SectionCard
        title="Tickets"
        description="Newest first"
        action={<Badge variant="warning">{open.length} open</Badge>}
      >
        {tickets.length === 0 ? (
          <EmptyState icon={LifeBuoy} title="No tickets" description="Contact form submissions from the public site land here." className="border-0 py-10" />
        ) : (
          <ul className="divide-y divide-border/60">
            {tickets.map((t) => (
              <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">{t.subject}</p>
                      <Badge variant={t.status === 'open' ? 'warning' : 'secondary'} className="text-[10px]">{t.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {t.name} · {t.phone} · {formatDate(t.createdAt, true)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`tel:+91${t.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`mailto:help@scrapkart.in?subject=${encodeURIComponent(`Re: ${t.subject} (${t.id})`)}`}>
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    {t.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => { closeTicket(t.id); toast.success('Ticket closed'); }}>
                        Close
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">{t.message}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
        <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Escalate weight or payment issues to the disputes tab.
        <Button variant="link" className="ml-auto h-auto p-0 text-xs" asChild>
          <Link to="/admin/disputes">Open disputes</Link>
        </Button>
      </div>
    </div>
  );
}
