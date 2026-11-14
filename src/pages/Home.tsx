import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronDown,
  IndianRupee,
  Leaf,
  MapPin,
  PackageCheck,
  PhoneCall,
  Quote,
  Recycle,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ListingCard } from '@/components/ListingCard';
import { Stars } from '@/components/StatusBadge';
import { useAppStore } from '@/context/AppStore';
import { CATEGORIES, categoryName } from '@/data/categories';
import { cn, formatCurrency } from '@/lib/utils';
import type { CategorySlug } from '@/lib/types';

/* ── Hero ────────────────────────────────────────────────────────────────── */
function Hero() {
  const { t, currentUser } = useAppStore();
  return (
    <section className="relative overflow-hidden">
      {/* soft eco blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-leaf-200/50 blur-3xl dark:bg-leaf-900/30" />
      <div className="pointer-events-none absolute -right-16 top-20 h-80 w-80 rounded-full bg-clay-200/40 blur-3xl dark:bg-clay-900/20" />

      <div className="container relative grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
        <div className="animate-fade-up">
          <Badge variant="success" className="mb-4 gap-1.5 px-3 py-1">
            <Sparkles className="h-3 w-3" /> {t('hero.badge')}
          </Badge>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('hero.sub')}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to={currentUser?.role === 'buyer' ? '/buyer' : '/seller/new'}>
                {currentUser?.role === 'buyer' ? t('cta.browse') : t('cta.sell')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/rates">See today's rates</Link>
            </Button>
          </div>

          <dl className="mt-9 grid max-w-lg grid-cols-3 gap-3">
            {[
              { label: 'Scrap collected', value: '18.4 t' },
              { label: 'Verified dealers', value: '120+' },
              { label: 'Avg. payout', value: '₹2,140' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/70 bg-card/70 px-3 py-2.5 backdrop-blur">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                <dd className="font-display text-lg font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Verified recyclers only · Payment on pickup · Free to list
          </div>
        </div>

        {/* Hero visual: illustrated rate card */}
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="relative mx-auto max-w-md">
            <div className="card-surface overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's best rates</p>
                  <p className="font-display text-xl font-bold">Nagpur, Maharashtra</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-leaf-700">
                  <IndianRupee className="h-5 w-5" />
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {(['copper', 'aluminium', 'ewaste', 'steel'] as CategorySlug[]).map((slug) => (
                  <HeroRateRow key={slug} slug={slug} />
                ))}
              </ul>
              <Button variant="secondary" className="mt-4 w-full" asChild>
                <Link to="/rates">View all 10 categories</Link>
              </Button>
            </div>

            {/* floating impact card */}
            <div className="absolute -bottom-6 -left-3 hidden animate-float rounded-xl border border-border/70 bg-card p-3 shadow-lift sm:block">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Leaf className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">CO₂ saved</p>
                  <p className="font-display text-sm font-bold">2,840 kg</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-2 -top-4 hidden animate-float rounded-xl border border-border/70 bg-card p-3 shadow-lift [animation-delay:1.5s] sm:block">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <Truck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Next pickup</p>
                  <p className="font-display text-sm font-bold">Tomorrow, 9 am</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroRateRow({ slug }: { slug: CategorySlug }) {
  const { state, lang } = useAppStore();
  const rate = state.rates.find((r) => r.category === slug);
  if (!rate) return null;
  const up = rate.changePct >= 0;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2">
      <CategoryIcon slug={slug} size="sm" />
      <span className="flex-1 text-sm font-semibold">{categoryName(slug, lang)}</span>
      <span className="font-display text-sm font-bold">₹{rate.ratePerKg}</span>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-[10px] font-bold',
          up ? 'text-emerald-600' : 'text-red-500',
        )}
      >
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(rate.changePct)}%
      </span>
    </li>
  );
}

/* ── 3 steps ─────────────────────────────────────────────────────────────── */
function Steps() {
  const steps = [
    {
      icon: Camera,
      title: 'List in 2 minutes',
      body: 'Pick a category, add approximate weight, upload up to 5 photos and drop your pickup pin.',
    },
    {
      icon: IndianRupee,
      title: 'Get real offers',
      body: 'Verified dealers see your listing instantly and send per-kg offers. Compare and accept the best.',
    },
    {
      icon: Truck,
      title: 'Get picked up & paid',
      body: 'Choose a slot, we weigh at your door on a digital scale, and you get paid by UPI or cash.',
    },
  ];
  return (
    <section className="container py-14 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="mb-3">How it works</Badge>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Sell your scrap in 3 simple steps</h2>
        <p className="mt-3 text-muted-foreground">
          No haggling with the kabadiwala. List once, get multiple offers from verified recyclers.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="absolute -right-3 -top-4 font-display text-7xl font-black text-primary/5 transition group-hover:text-primary/10">
              {i + 1}
            </span>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-leaf-700">
              <s.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button size="lg" asChild>
          <Link to="/seller/new">Start selling now <ArrowRight className="h-5 w-5" /></Link>
        </Button>
      </div>
    </section>
  );
}

/* ── Live rate card ──────────────────────────────────────────────────────── */
function RateTeaser() {
  const { state, lang } = useAppStore();
  const top = state.rates.slice(0, 6);
  return (
    <section className="border-y border-border/70 bg-card/60 py-14 lg:py-20">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge variant="success" className="mb-3">Updated today, 9:00 am</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Live scrap rates</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Rates are set daily by our verified dealers. You always see the price before you accept.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/rates">Full rate card <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((r) => {
            const up = r.changePct >= 0;
            return (
              <Link
                key={r.id}
                to={`/rates#${r.category}`}
                className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-soft"
              >
                <CategoryIcon slug={r.category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{categoryName(r.category, lang)}</p>
                  <p className={cn('flex items-center gap-1 text-[11px] font-medium', up ? 'text-emerald-600' : 'text-red-500')}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {up ? '+' : ''}{r.changePct}% vs yesterday
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold leading-none">₹{r.ratePerKg}</p>
                  <p className="text-[10px] text-muted-foreground">per kg</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Categories ──────────────────────────────────────────────────────────── */
function Categories() {
  const { lang } = useAppStore();
  return (
    <section className="container py-14 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="mb-3">What we buy</Badge>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">We accept almost everything</h2>
        <p className="mt-3 text-muted-foreground">
          From household bottles to factory offcuts — pick a category to see today's rate.
        </p>
      </div>
      <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            to={`/rates#${c.slug}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
          >
            <CategoryIcon slug={c.slug} size="lg" />
            <span className="text-sm font-semibold">{categoryName(c.slug, lang)}</span>
            <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{c.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Live listings preview ───────────────────────────────────────────────── */
function LiveListings() {
  const { state } = useAppStore();
  const listings = state.listings.filter((l) => l.status === 'listed').slice(0, 3);
  if (!listings.length) return null;
  return (
    <section className="border-y border-border/70 bg-secondary/30 py-14 lg:py-20">
      <div className="container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Badge variant="clay" className="mb-3">Just listed</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Fresh scrap near you</h2>
            <p className="mt-2 text-muted-foreground">Dealers: log in to send offers. Prices update in real time.</p>
          </div>
          <Button variant="outline" className="hidden sm:inline-flex" asChild>
            <Link to="/signup?role=buyer">Join as dealer</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Impact counter ──────────────────────────────────────────────────────── */
function Impact() {
  const stats = [
    { icon: Recycle, label: 'Scrap recycled', value: '18,420 kg' },
    { icon: Leaf, label: 'CO₂ saved', value: '31,600 kg' },
    { icon: Users, label: 'Households served', value: '2,140' },
    { icon: Wallet, label: 'Paid to sellers', value: '₹42.8 L' },
  ];
  return (
    <section className="container py-14 lg:py-20">
      <div className="overflow-hidden rounded-3xl gradient-leaf p-8 text-white sm:p-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="mb-3 border-white/30 bg-white/15 text-white">Environmental impact</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Every kilogram counts</h2>
            <p className="mt-3 max-w-lg text-white/80">
              Recycling aluminium saves 92% of the energy needed to make it from raw ore. When you sell
              on ScrapKart, your dashboard tracks exactly how much CO₂ you keep out of the air.
            </p>
            <Button variant="white" className="mt-6" asChild>
              <Link to="/how-it-works">Learn how we measure it</Link>
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <s.icon className="h-5 w-5 text-white/70" />
                <dd className="mt-2 font-display text-2xl font-bold">{s.value}</dd>
                <dt className="text-xs text-white/70">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Meera Kulkarni',
    role: 'Homemaker · Nagpur',
    rating: 5,
    text: 'I used to sell a whole month of newspapers for ₹80. On ScrapKart I got ₹240 and the dealer came to my door.',
  },
  {
    name: 'Sandeep Rathi',
    role: 'Factory owner · Butibori MIDC',
    rating: 5,
    text: 'We clear about 2 tonnes of steel offcuts monthly. Three offers on every listing — pricing is transparent and buyers are verified.',
  },
  {
    name: 'Rakesh Verma',
    role: 'Dealer · Verma Scrap & Recycling',
    rating: 4,
    text: 'The buyer dashboard is what I needed — filters by category, distance and weight. Payment records sit in one wallet.',
  },
];

function Testimonials() {
  return (
    <section className="border-y border-border/70 bg-card/60 py-14 lg:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-3">Testimonials</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Loved by sellers and dealers</h2>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Stars value={5} /> <span>4.8 average from 320+ reviews</span>
          </div>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <Quote className="h-6 w-6 text-primary/30" />
              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-foreground/80">"{t.text}"</blockquote>
              <Stars value={t.rating} className="mt-3" />
              <figcaption className="mt-3 border-t border-border/60 pt-3">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Do I need to weigh the scrap myself?',
    a: 'No. Give your best estimate when listing — the dealer carries a calibrated digital scale and weighs everything at your door before payment.',
  },
  {
    q: 'How and when do I get paid?',
    a: 'Payment happens on pickup. Choose UPI (instant bank transfer), card/netbanking via Razorpay, or cash on pickup. Every payment is logged in your earnings tab.',
  },
  {
    q: 'Who picks up the scrap?',
    a: 'Only dealers whose business documents we have verified. You can see their rating, completed orders and service area before accepting an offer.',
  },
  {
    q: 'Is there any charge for listing?',
    a: 'Listing is completely free for sellers. Dealers pay a small commission only when a deal is completed.',
  },
  {
    q: 'What if the dealer does not turn up?',
    a: 'You can reschedule or cancel before pickup, and report the dealer from the order page. Our support team responds within 24 hours.',
  },
  {
    q: 'What items are not accepted?',
    a: 'Hazardous, radioactive or medical waste, live ammunition and sealed pressurised containers. E-waste must be non-leaking with batteries removed.',
  },
];

function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <section id="faq" className="container py-14 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Badge variant="outline" className="mb-3">FAQ</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Questions, answered</h2>
          <p className="mt-3 text-muted-foreground">
            Still unsure about something? Our team replies on WhatsApp within a few minutes.
          </p>
          <Button variant="outline" className="mt-5" asChild>
            <Link to="/support"><PhoneCall className="h-4 w-4" /> Talk to support</Link>
          </Button>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border/70 bg-card">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                aria-expanded={open === i}
              >
                <span className="text-sm font-semibold">{f.q}</span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open === i && 'rotate-180')}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-300',
                  open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="container pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 text-center shadow-soft sm:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="relative">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-leaf text-white">
            <PackageCheck className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Your scrap is worth more than you think</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join 2,000+ households and businesses in Nagpur who turned their waste into ₹42 lakh.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/signup">Create free account <ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/rates">Check scrap rates</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {[
              { icon: BadgeCheck, text: 'Verified dealers' },
              { icon: Scale, text: 'Digital weighing' },
              { icon: Wallet, text: 'Instant UPI payout' },
              { icon: ShieldCheck, text: 'Secure & private' },
            ].map((b) => (
              <span key={b.text} className="inline-flex items-center gap-1.5">
                <b.icon className="h-3.5 w-3.5 text-primary" /> {b.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Steps />
      <RateTeaser />
      <Categories />
      <LiveListings />
      <Impact />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
