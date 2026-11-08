import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ClipboardList,
  Handshake,
  IndianRupee,
  MapPin,
  PackageCheck,
  Scale,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CATEGORIES, CO2_FACTOR } from '@/data/categories';
import { formatWeight } from '@/lib/utils';

const SELLER_STEPS = [
  {
    icon: ClipboardList,
    title: 'Create your free account',
    body: 'Sign up with your phone number and a one-time password. No paperwork, no fees.',
  },
  {
    icon: CategoryIconMock,
    title: 'List your scrap',
    body: 'Choose the category, add approximate weight and condition, and upload up to 5 photos.',
  },
  {
    icon: MapPin,
    title: 'Pin your pickup spot',
    body: 'Drop a pin on the map and pick a preferred date and time slot that suits you.',
  },
  {
    icon: Handshake,
    title: 'Compare dealer offers',
    body: 'Verified recyclers send per-kg offers. Accept the best one, or counter-offer.',
  },
  {
    icon: Scale,
    title: 'Doorstep weighing',
    body: 'On pickup day the dealer weighs everything on a digital scale in front of you.',
  },
  {
    icon: Wallet,
    title: 'Get paid instantly',
    body: 'Receive money over UPI, Razorpay or cash on pickup. The receipt lands in your dashboard.',
  },
];

function CategoryIconMock({ className }: { className?: string }) {
  return <CategoryIcon slug="plastic" size="sm" withTile={false} className={className} />;
}

const DEALER_POINTS = [
  { icon: ShieldCheck, title: 'Verified onboarding', body: 'GST, shop licence and service areas are checked before your account goes live.' },
  { icon: Camera, title: 'Photo-first leads', body: 'Every listing includes photos, weight, condition and an accurate map pin.' },
  { icon: Truck, title: 'Route-friendly filters', body: 'Filter by category, distance, weight and asking price to fill your truck efficiently.' },
  { icon: Wallet, title: 'One wallet', body: 'Track every payout, commission and invoice in a single ledger.' },
];

export default function HowItWorks() {
  return (
    <div className="container py-8 lg:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="success" className="mb-3">How ScrapKart works</Badge>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
          From clutter to cash — the honest way
        </h1>
        <p className="mt-3 text-muted-foreground">
          ScrapKart replaces the guesswork of selling to a local kabadiwala with a transparent
          marketplace: live rates, verified buyers and doorstep pickup.
        </p>
      </div>

      {/* Seller journey */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">For sellers</h2>
        <p className="mt-1 text-sm text-muted-foreground">Six steps, about 15 minutes of your time in total.</p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SELLER_STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className="absolute right-4 top-4 font-display text-3xl font-black text-primary/10">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-leaf-700">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Dealer journey */}
      <section className="mt-14 rounded-3xl border border-border/70 bg-card p-6 shadow-soft sm:p-9">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl font-bold">For dealers & recyclers</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Apply once, get verified, then buy scrap from thousands of households and businesses in
              your service area.
            </p>
          </div>
          <Button asChild>
            <Link to="/signup?role=buyer">Register your business <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEALER_POINTS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-2 text-sm font-semibold">{p.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Accepted materials */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold">What we accept</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <div key={c.slug} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3">
              <CategoryIcon slug={c.slug} size="sm" />
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Not accepted: hazardous or medical waste, radioactive material, sealed pressurised
          containers and ammunition.
        </p>
      </section>

      {/* Impact table */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold">How we calculate your CO₂ savings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For every kilogram recycled instead of landfilled, we multiply by a published factor for that
          material. Your dashboard shows the running total.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Material</th>
                <th className="px-4 py-2.5 text-right">CO₂ saved / kg</th>
                <th className="px-4 py-2.5 text-right">For 25 kg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {CATEGORIES.map((c) => (
                <tr key={c.slug}>
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{CO2_FACTOR[c.slug]} kg</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-primary">
                    {formatWeight(CO2_FACTOR[c.slug] * 25)} CO₂
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust */}
      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          { icon: BadgeCheck, title: 'Verified dealers', body: 'We check business documents, GST and service areas before approving any buyer.' },
          { icon: ScanIcon, title: 'Transparent weighing', body: 'Digital scales in front of you, recorded into the order timeline.' },
          { icon: IndianRupee, title: 'No hidden cuts', body: 'The rate you accept is the rate you are paid. Commission comes from dealers only.' },
        ].map((b) => (
          <div key={b.title} className="rounded-2xl border border-border/70 bg-secondary/40 p-5">
            <b.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-2 font-display text-base font-semibold">{b.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </section>

      <div className="mt-12 flex flex-col items-center gap-3 rounded-3xl gradient-leaf p-8 text-center text-white">
        <PackageCheck className="h-8 w-8" />
        <h2 className="font-display text-2xl font-bold">Ready to clear that corner of your home?</h2>
        <p className="max-w-md text-sm text-white/80">
          Listing is free and takes two minutes. You only commit when you accept an offer.
        </p>
        <Button variant="white" size="lg" className="mt-2" asChild>
          <Link to="/signup">Create your free account <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return <Scale className={className} />;
}
