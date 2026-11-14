import * as React from 'react';
import { Check, Copy, Gift, Leaf, Share2, Sparkles, Trophy, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard, PageHeader, StatCard } from '@/components/DashboardShell';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { co2Saved } from '@/data/categories';
import { Progress } from '@/components/ui/misc';

const TIERS = [
  { name: 'Sprout', min: 0, perk: 'Basic listing tools', icon: Leaf },
  { name: 'Sapling', min: 200, perk: 'Priority dealer offers', icon: Sparkles },
  { name: 'Tree', min: 500, perk: '₹100 pickup bonus', icon: Trophy },
  { name: 'Forest', min: 1000, perk: 'Zero commission month', icon: Gift },
];

export default function Referrals() {
  const { currentUser, state } = useAppStore();
  const toast = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!currentUser) return null;
  const points = currentUser.rewardPoints ?? 0;
  const code = currentUser.referralCode;
  const link = `${window.location.origin}/signup?ref=${code}`;
  const referred = state.users.filter((u) => u.referredBy?.toLowerCase() === code.toLowerCase());
  const nextTier = TIERS.find((t) => t.min > points) ?? TIERS[TIERS.length - 1];
  const currentTier = [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
  const progress = Math.min(100, (points / nextTier.min) * 100);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy', 'Please copy it manually.');
    }
  };

  const share = async () => {
    const text = `Sell your scrap on ScrapKart and get the best per-kg rates. Use my code ${code} for 50 bonus points.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ScrapKart', text, url: link });
        return;
      } catch {
        /* user cancelled */
      }
    }
    void copy(`${text} ${link}`, 'Invite message');
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Rewards & referral" description="Earn reward points every time you sell — and when friends join" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Reward points" value={String(points)} icon={Sparkles} hint={`≈ ${formatCurrency(points / 4)} in rewards`} />
        <StatCard label="Friends joined" value={String(referred.length)} icon={Users} tone="sky" hint="50 pts each" />
        <StatCard label="Wallet balance" value={formatCurrency(currentUser.walletBalance ?? 0)} icon={Wallet} tone="clay" hint="Ready to withdraw" />
        <StatCard
          label="Impact"
          value={`${formatWeight(
            state.orders
              .filter((o) => o.sellerId === currentUser.id && o.status === 'paid')
              .reduce((a, o) => a + co2Saved(o.finalWeightKg ?? o.declaredWeightKg, o.category), 0),
          )} CO₂`}
          icon={Leaf}
          tone="violet"
          hint="Saved so far"
        />
      </div>

      <div className="overflow-hidden rounded-2xl gradient-leaf p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="border-white/30 bg-white/15 text-white">
              <Gift className="h-3 w-3" /> Refer & earn
            </Badge>
            <h2 className="mt-2 font-display text-2xl font-bold">Give 50 points, get 100</h2>
            <p className="mt-1 max-w-md text-sm text-white/80">
              Share your code. Your friend gets 50 welcome points, and you earn 100 once they complete
              their first pickup.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
              <span className="font-mono text-lg font-bold tracking-wider">{code}</span>
              <Button size="icon-sm" variant="white" onClick={() => copy(code, 'Referral code')} aria-label="Copy referral code">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <Button variant="white" onClick={share}>
              <Share2 className="h-4 w-4" /> Share invite
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Your tier" description={`You are a ${currentTier.name}`}>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-leaf-700">
              <currentTier.icon className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{currentTier.name} · {currentTier.perk}</p>
              <p className="text-xs text-muted-foreground">
                {points < nextTier.min
                  ? `${nextTier.min - points} points to ${nextTier.name} (${nextTier.perk})`
                  : 'You are at the top tier — legend! 🌳'}
              </p>
            </div>
          </div>
          <Progress value={progress} className="mt-3" />
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={
                  points >= t.min
                    ? 'rounded-lg border border-primary/30 bg-primary/5 p-2 text-center'
                    : 'rounded-lg border border-border p-2 text-center opacity-60'
                }
              >
                <t.icon className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-[10px] font-semibold">{t.name}</p>
                <p className="text-[9px] text-muted-foreground">{t.min} pts</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="How to earn points" description="Points convert at 4 points = ₹1">
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'Complete a pickup', pts: '+1 per ₹20 earned' },
              { label: 'Refer a friend who sells', pts: '+100' },
              { label: 'Leave a review after pickup', pts: '+10' },
              { label: 'List 3 items in a month', pts: '+25' },
              { label: 'Recycle e-waste', pts: '+15 per kg' },
            ].map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <span>{r.label}</span>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-leaf-700">
                  {r.pts}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Friends you referred" description="Points are credited after their first completed pickup">
        {referred.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No referrals yet. Share your code to get started.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {referred.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <Badge variant="success">+100 pts</Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
