import * as React from 'react';
import { Check, Pencil, RefreshCw, TrendingDown, TrendingUp, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/DashboardShell';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { categoryName } from '@/data/categories';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { CategorySlug } from '@/lib/types';

export default function AdminRates() {
  const { state, setRate, lang } = useAppStore();
  const toast = useToast();
  const [editing, setEditing] = React.useState<CategorySlug | null>(null);
  const [value, setValue] = React.useState('');
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkPct, setBulkPct] = React.useState('');

  const openEdit = (slug: CategorySlug, current: number) => {
    setEditing(slug);
    setValue(String(current));
  };

  const save = () => {
    if (!editing) return;
    const num = Number(value);
    const res = setRate(editing, num);
    if (!res.ok) return toast.error('Could not update rate', res.error);
    toast.success('Rate updated', `${categoryName(editing, 'en')} is now ₹${num}/kg`);
    setEditing(null);
  };

  const applyBulk = () => {
    const pct = Number(bulkPct);
    if (!pct) {
      toast.error('Enter a percentage');
      return;
    }
    state.rates.forEach((r) => {
      const next = Math.round(r.ratePerKg * (1 + pct / 100) * 10) / 10;
      setRate(r.category, Math.max(1, next));
    });
    toast.success('Rates adjusted', `All categories ${pct > 0 ? 'increased' : 'decreased'} by ${Math.abs(pct)}%`);
    setBulkOpen(false);
    setBulkPct('');
  };

  const sections: { title: string; subtitle: string; slugs: CategorySlug[] }[] = [
    { title: 'Plastics & paper', subtitle: 'Volume materials', slugs: ['plastic', 'paper', 'cardboard'] },
    { title: 'Ferrous metals', subtitle: 'Steel and iron', slugs: ['steel', 'iron'] },
    { title: 'Non-ferrous metals', subtitle: 'High value', slugs: ['aluminium', 'copper'] },
    { title: 'E-waste & glass', subtitle: 'Special handling', slugs: ['ewaste', 'glass', 'other'] },
  ];

  return (
    <div>
      <PageHeader
        title="Daily scrap rates"
        description="Update the per-kg buying rate used across listings and estimates"
        action={
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
            <RefreshCw className="h-4 w-4" /> Bulk adjust
          </Button>
        }
      />

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-border/70 bg-card shadow-soft">
            <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div>
                <h2 className="font-display text-sm font-semibold">{section.title}</h2>
                <p className="text-[11px] text-muted-foreground">{section.subtitle}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{section.slugs.length} categories</Badge>
            </header>
            <ul className="divide-y divide-border/60">
              {section.slugs.map((slug) => {
                const r = state.rates.find((x) => x.category === slug);
                if (!r) return null;
                const up = r.changePct >= 0;
                return (
                  <li key={slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <CategoryIcon slug={slug} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{categoryName(slug, lang)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Updated {formatDate(r.updatedAt, true)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 text-[11px] font-bold',
                        up ? 'text-emerald-600' : 'text-red-500',
                      )}
                    >
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(r.changePct)}%
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-display text-base font-bold leading-none">{formatCurrency(r.ratePerKg)}</p>
                        <p className="text-[10px] text-muted-foreground">per kg</p>
                      </div>
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(slug, r.ratePerKg)} aria-label={`Edit ${slug} rate`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
        <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Rate changes apply immediately to new listings and to the public rate card. Existing deals keep the
        rate that was agreed when the offer was accepted.
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {editing ? categoryName(editing, 'en') : ''} rate</DialogTitle>
            <DialogDescription>
              This becomes the live buying rate per kilogram, shown on the public rate card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rate">Rate per kg (₹)</Label>
            <Input id="rate" type="number" min={1} step="0.5" value={value} onChange={(e) => setValue(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              A 25 kg lot would be worth {formatCurrency((Number(value) || 0) * 25)}.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save}><Check className="h-4 w-4" /> Save rate</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk adjust all rates</DialogTitle>
            <DialogDescription>
              Apply a percentage change to every category at once, then fine-tune individually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="pct">Change (%)</Label>
            <Input id="pct" type="number" step="0.5" value={bulkPct} onChange={(e) => setBulkPct(e.target.value)} placeholder="e.g. 2.5 or -1.5" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={applyBulk}>Apply to all</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
