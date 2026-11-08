import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '@/components/DashboardShell';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { cn, isValidPhone } from '@/lib/utils';

const FAQS = [
  { q: 'How do I get paid for my scrap?', a: 'The dealer pays at pickup — UPI transfer, Razorpay (card/netbanking) or cash. You can also track every payment in your Earnings tab.' },
  { q: 'Who decides the final price?', a: 'You do. You can accept the live market rate, set your own asking price, or compare multiple dealer offers and counter them.' },
  { q: 'My dealer did not arrive. What now?', a: 'Open the order and reschedule or cancel — repeated no-shows affect the dealer rating. You can also raise a dispute and our team will follow up within 24 hours.' },
  { q: 'Is there a minimum quantity?', a: 'No minimum for sellers. Dealers usually find 10 kg+ worth their trip, and lots above 500 kg get bulk pricing.' },
  { q: 'How do I become a verified dealer?', a: 'Sign up with your business name, GSTIN (optional) and service areas. Our team verifies the details — usually within one working day.' },
  { q: 'What if I disagree with the weighed quantity?', a: 'Ask the dealer to weigh again in front of you. If it is still different from your scale, raise a dispute from the order page and we will mediate.' },
];

export default function Support() {
  const { currentUser, createTicket } = useAppStore();
  const toast = useToast();
  const [open, setOpen] = React.useState<number | null>(0);
  const [form, setForm] = React.useState({
    name: currentUser?.name ?? '',
    phone: currentUser?.phone ?? '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [sent, setSent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Please enter your name';
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (!form.subject.trim()) next.subject = 'Add a short subject';
    if (form.message.trim().length < 10) next.message = 'Please describe the issue (10+ characters)';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setTimeout(() => {
      const res = createTicket(form);
      setSubmitting(false);
      if (!res.ok) return toast.error('Could not submit', res.error);
      setSent(true);
      toast.success('Message sent', 'Our team usually replies within 4 working hours.');
    }, 700);
  };

  return (
    <div className="container py-8 lg:py-12">
      <div className="max-w-2xl">
        <Badge variant="success" className="mb-3"><MessageCircle className="h-3 w-3" /> We reply in under 4 hours</Badge>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Contact & support</h1>
        <p className="mt-2 text-muted-foreground">
          Questions about rates, pickups or payments? Reach us on WhatsApp, phone or the form below.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: MessageCircle, label: 'WhatsApp', value: '+91 90000 00001', href: 'https://wa.me/919000000001', note: 'Fastest · 9 am – 8 pm' },
          { icon: Phone, label: 'Call us', value: '+91 90000 00001', href: 'tel:+919000000001', note: 'Mon – Sat, 9 am – 7 pm' },
          { icon: Mail, label: 'Email', value: 'help@scrapkart.in', href: 'mailto:help@scrapkart.in', note: 'Replies within 4 working hours' },
        ].map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-leaf-700">
              <c.icon className="h-5 w-5" />
            </span>
            <p className="mt-2 text-sm font-semibold">{c.label}</p>
            <p className="text-sm text-primary">{c.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{c.note}</p>
          </a>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <SectionCard title="Send us a message" description="We will get back on your registered mobile">
            {sent ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <p className="font-display text-lg font-semibold">Message received</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Ticket created. Our support team will call or WhatsApp you on +91 {form.phone} shortly.
                </p>
                <Button variant="outline" className="mt-2" onClick={() => { setSent(false); setForm((f) => ({ ...f, subject: '', message: '' })); }}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3" noValidate>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} />
                    {errors.name && <p className="text-xs font-medium text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Mobile number</Label>
                    <Input
                      id="phone"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && <p className="text-xs font-medium text-destructive">{errors.phone}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. Pickup did not arrive" aria-invalid={!!errors.subject} />
                  {errors.subject && <p className="text-xs font-medium text-destructive">{errors.subject}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">How can we help?</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Share order codes, dates and anything else useful…"
                    className="min-h-[110px]"
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && <p className="text-xs font-medium text-destructive">{errors.message}</p>}
                </div>
                <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                  {!submitting && <Send className="h-4 w-4" />} Send message
                </Button>
              </form>
            )}
          </SectionCard>

          <div id="faq">
            <h2 className="mb-3 font-display text-xl font-bold">Frequently asked</h2>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border/70 bg-card">
              {FAQS.map((f, i) => (
                <div key={f.q}>
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                    aria-expanded={open === i}
                  >
                    <span className="text-sm font-semibold">{f.q}</span>
                    <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open === i && 'rotate-180')} />
                  </button>
                  <div className={cn('grid transition-all duration-300', open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                    <div className="overflow-hidden">
                      <p className="px-4 pb-3.5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="gradient-leaf p-5 text-white">
              <h2 className="font-display text-lg font-bold">Office & operations hub</h2>
              <p className="mt-1 text-sm text-white/80">Walk in for dealer verification and bulk deals.</p>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                2nd Floor, IT Park, Gayatri Nagar, Nagpur, Maharashtra 440022
              </p>
              <p className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Mon – Sat, 9:00 am – 7:00 pm · Sunday closed
              </p>
              <p className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+919000000001" className="hover:text-primary">+91 90000 00001</a>
              </p>
              <p className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:help@scrapkart.in" className="hover:text-primary">help@scrapkart.in</a>
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                <iframe
                  title="ScrapKart office location"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=79.04%2C21.10%2C79.13%2C21.17&layer=mapnik&marker=21.1358%2C79.0882"
                  className="h-44 w-full"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-xs">
            <p className="font-semibold">Need urgent help during a pickup?</p>
            <p className="mt-1 text-muted-foreground">
              Call our pickup helpline and quote your order code. We can reach the dealer directly.
            </p>
            <Button size="sm" className="mt-3 w-full" asChild>
              <a href="tel:+919000000001"><Phone className="h-4 w-4" /> Call pickup helpline</a>
            </Button>
            <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
              <Link to="/profile">Manage my account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
