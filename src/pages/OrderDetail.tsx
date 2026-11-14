import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  IndianRupee,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Scale,
  ShieldCheck,
  Smartphone,
  Star,
  Truck,
  User,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, StatusTimeline, Stars } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MapView } from '@/components/MapPicker';
import { ChatPanel } from '@/components/ChatPanel';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { categoryName, co2Saved } from '@/data/categories';
import { cn, downloadFile, formatCurrency, formatDate, formatWeight, timeAgo } from '@/lib/utils';
import type { PaymentMode, TimeSlot } from '@/lib/types';

const SLOTS: { value: TimeSlot; label: string; time: string }[] = [
  { value: 'morning', label: 'Morning', time: '9 am – 12 pm' },
  { value: 'afternoon', label: 'Afternoon', time: '12 – 4 pm' },
  { value: 'evening', label: 'Evening', time: '4 – 7 pm' },
];

/**
 * Shared order page for sellers and dealers. Everything about one pickup lives
 * here: the timeline, rescheduling, final weighing, payment and reviews.
 */
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    state,
    currentUser,
    lang,
    schedulePickup,
    markCollected,
    payOrder,
    cancelOrder,
    raiseDispute,
    addReview,
  } = useAppStore();
  const toast = useToast();

  const order = state.orders.find((o) => o.id === id);
  const isSeller = order?.sellerId === currentUser?.id;
  const isBuyer = order?.buyerId === currentUser?.id;

  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [collectOpen, setCollectOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [disputeOpen, setDisputeOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const [pickDate, setPickDate] = React.useState(order?.pickupDate ?? '');
  const [pickSlot, setPickSlot] = React.useState<TimeSlot>(order?.pickupSlot ?? 'morning');
  const [finalWeight, setFinalWeight] = React.useState(order ? String(order.finalWeightKg ?? order.declaredWeightKg) : '');
  const [payMode, setPayMode] = React.useState<PaymentMode>('upi');
  const [paying, setPaying] = React.useState(false);
  const [disputeReason, setDisputeReason] = React.useState('Weight mismatch');
  const [disputeDetails, setDisputeDetails] = React.useState('');
  const [rating, setRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  if (!order) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Order not found"
          description="This order may have been removed."
          action={<Button asChild><Link to="/">Go home</Link></Button>}
        />
      </div>
    );
  }
  if (!isSeller && !isBuyer && currentUser?.role !== 'admin') {
    return (
      <div className="container py-16">
        <EmptyState
          title="You don't have access to this order"
          description="Only the seller and the dealer involved can see the pickup details."
          action={<Button asChild><Link to="/">Go home</Link></Button>}
        />
      </div>
    );
  }

  const counterparty = state.users.find((u) => u.id === (isSeller ? order.buyerId : order.sellerId));
  const listing = state.listings.find((l) => l.id === order.listingId);
  const existingReview = state.reviews.find((r) => r.orderId === order.id && r.authorId === currentUser?.id);
  const basePath = isSeller ? '/seller/orders' : '/buyer/orders';
  const finalAmount = Math.round((order.finalWeightKg ?? order.declaredWeightKg) * order.agreedRate * 100) / 100;
  const canSchedule = ['accepted', 'pickup_scheduled'].includes(order.status);

  /* ── actions ── */
  const doSchedule = () => {
    const next: Record<string, string> = {};
    if (!pickDate) next.date = 'Choose a date';
    else if (new Date(pickDate) < new Date(new Date().toDateString())) next.date = 'Date cannot be in the past';
    setErrors(next);
    if (Object.keys(next).length) return;
    const res = schedulePickup(order.id, pickDate, pickSlot);
    if (!res.ok) return toast.error('Could not schedule pickup', res.error);
    toast.success('Pickup scheduled', `${formatDate(pickDate)} · ${SLOTS.find((s) => s.value === pickSlot)?.time}`);
    setScheduleOpen(false);
  };

  const doCollect = () => {
    const w = Number(finalWeight);
    if (!(w > 0)) {
      setErrors({ weight: 'Enter the weighed quantity' });
      return;
    }
    const res = markCollected(order.id, w, payMode);
    if (!res.ok) {
      setErrors({ weight: res.error });
      return;
    }
    toast.success('Marked as collected', 'The seller has been notified to confirm payment.');
    setCollectOpen(false);
  };

  const doPay = () => {
    setPaying(true);
    // In production this opens Razorpay checkout; demo simulates a 1.2s success.
    setTimeout(() => {
      const res = payOrder(order.id, payMode);
      setPaying(false);
      if (!res.ok) return toast.error('Payment failed', res.error);
      toast.success('Payment successful 🎉', `${formatCurrency(order.amount)} recorded via ${payMode.toUpperCase()}`);
      setPayOpen(false);
    }, 1200);
  };

  const doReview = () => {
    if (!reviewText.trim()) {
      setErrors({ review: 'Please write a short review' });
      return;
    }
    const res = addReview({
      orderId: order.id,
      targetId: counterparty!.id,
      rating,
      comment: reviewText,
    });
    if (!res.ok) return toast.error('Could not submit review', res.error);
    toast.success('Thanks for the review!');
    setReviewOpen(false);
    setReviewText('');
  };

  /** Generates a simple printable receipt (no server needed). */
  const downloadReceipt = () => {
    const lines = [
      'SCRAPKART — PAYMENT RECEIPT',
      '==========================',
      `Order: ${order.code}`,
      `Date: ${formatDate(order.paidAt ?? new Date(), true)}`,
      `Category: ${categoryName(order.category, 'en')}`,
      `Rate: ₹${order.agreedRate}/kg`,
      `Weight: ${order.finalWeightKg ?? order.declaredWeightKg} kg`,
      `Amount: ₹${order.amount}`,
      `Mode: ${order.paymentMode ?? '—'}`,
      `Seller: ${state.users.find((u) => u.id === order.sellerId)?.name}`,
      `Dealer: ${state.users.find((u) => u.id === order.buyerId)?.businessName ?? ''}`,
      '',
      'Thank you for recycling with ScrapKart.',
      'help@scrapkart.in · +91 90000 00001',
    ].join('\n');
    if (!downloadFile(`scrapkart-receipt-${order.code}.txt`, lines))
      toast.error('Download blocked', 'Please allow downloads for this site and try again.');
  };

  return (
    <div className="container max-w-5xl py-6 lg:py-10">
      <Link to={basePath} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold">Order {order.code}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {listing?.title ?? categoryName(order.category, lang)} · created {timeAgo(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSchedule && (
            <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)}>
              <CalendarClock className="h-4 w-4" /> {order.status === 'accepted' ? 'Schedule pickup' : 'Reschedule'}
            </Button>
          )}
          {isBuyer && ['accepted', 'pickup_scheduled'].includes(order.status) && (
            <Button size="sm" onClick={() => setCollectOpen(true)}>
              <Scale className="h-4 w-4" /> Mark collected & pay
            </Button>
          )}
          {order.status === 'picked_up' && (
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <IndianRupee className="h-4 w-4" /> {isBuyer ? 'Pay seller' : 'Confirm payment'}
            </Button>
          )}
          {order.status === 'paid' && !existingReview && (
            <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
              <Star className="h-4 w-4" /> Leave a review
            </Button>
          )}
          {order.status === 'paid' && (
            <Button size="sm" variant="outline" onClick={downloadReceipt}>
              <Download className="h-4 w-4" /> Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
        <StatusTimeline current={order.status} kind="order" />
        {['accepted', 'pickup_scheduled'].includes(order.status) && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
            <Truck className="h-3.5 w-3.5 text-primary" />
            Pickup {formatDate(order.pickupDate)} · {SLOTS.find((s) => s.value === order.pickupSlot)?.time}
          </p>
        )}
        {order.status === 'picked_up' && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            <Info className="h-3.5 w-3.5" />
            Collected {order.finalWeightKg} kg. {formatCurrency(order.amount)} is due —{' '}
            {isBuyer ? 'complete the payment to close this order' : 'the dealer will settle payment shortly'}.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {/* Deal summary */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="font-display text-base font-semibold">Deal summary</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[11px] text-muted-foreground">Agreed rate</dt>
                <dd className="font-semibold">{formatCurrency(order.agreedRate)}/kg</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Declared weight</dt>
                <dd className="font-semibold">{formatWeight(order.declaredWeightKg)}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Final weight</dt>
                <dd className="font-semibold">
                  {order.finalWeightKg ? formatWeight(order.finalWeightKg) : <span className="text-muted-foreground">Pending</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Amount</dt>
                <dd className="font-display text-base font-bold text-primary">{formatCurrency(finalAmount)}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Payment mode</dt>
                <dd className="font-semibold capitalize">{order.paymentMode ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">CO₂ saved</dt>
                <dd className="font-semibold text-emerald-600">
                  {co2Saved(order.finalWeightKg ?? order.declaredWeightKg, order.category)} kg
                </dd>
              </div>
            </dl>
          </div>

          {/* Counterparty */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-leaf-700">
                  <User className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{counterparty?.businessName ?? counterparty?.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {isSeller ? 'Verified dealer' : 'Seller'} · {counterparty?.city}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Stars value={Math.round(counterparty?.rating ?? 0)} size="sm" />
                    {counterparty?.rating?.toFixed(1) ?? 'New'} ({counterparty?.ratingCount ?? 0})
                  </div>
                </div>
              </div>
              {counterparty?.verificationStatus === 'approved' && (
                <Badge variant="success"><BadgeCheck className="h-3 w-3" /> Verified</Badge>
              )}
            </div>

            {['accepted', 'pickup_scheduled', 'picked_up', 'paid'].includes(order.status) && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/60 px-3 py-2 text-xs">
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-semibold">+91 {counterparty?.phone}</p>
                </div>
                <div className="rounded-xl bg-muted/60 px-3 py-2 text-xs">
                  <p className="text-muted-foreground">GSTIN</p>
                  <p className="font-semibold">{counterparty?.gstin ?? 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Pickup location */}
          {listing && (
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
              <h2 className="mb-2 font-display text-base font-semibold">Pickup location</h2>
              <MapView
                lat={listing.pickup.lat}
                lng={listing.pickup.lng}
                height={190}
                label={`${listing.pickup.address}, ${listing.pickup.city} – ${listing.pickup.pincode}`}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${listing.pickup.lat},${listing.pickup.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Open directions
                  </a>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/listing/${listing.id}`}>View listing</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Chat */}
          <div>
            <h2 className="mb-2 font-display text-base font-semibold">Chat with {isSeller ? 'dealer' : 'seller'}</h2>
            <ChatPanel listingId={order.listingId} otherUserId={counterparty!.id} height={260} />
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="font-display text-base font-semibold">Timeline</h2>
            <ol className="mt-3 space-y-3">
              {order.timeline.map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-leaf-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold capitalize">{t.status.replace('_', ' ')}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(t.at, true)}</p>
                    {t.note && <p className="mt-0.5 text-[11px] text-muted-foreground">{t.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {order.status === 'paid' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                <Wallet className="h-4 w-4" /> Payment settled
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/70">
                {formatCurrency(order.amount)} via {order.paymentMode === 'cash' ? 'cash on pickup' : order.paymentMode?.toUpperCase()} on{' '}
                {formatDate(order.paidAt ?? order.createdAt)}
              </p>
              {existingReview && (
                <div className="mt-2 rounded-lg bg-white/60 p-2 text-xs dark:bg-forest-900/40">
                  <Stars value={existingReview.rating} size="sm" />
                  <p className="mt-1 text-foreground/80">"{existingReview.comment}"</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="font-display text-base font-semibold">Need help?</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Weight mismatch, no-show or payment delay — we step in within 24 hours.
            </p>
            <div className="mt-3 space-y-2">
              <Button size="sm" variant="outline" className="w-full" onClick={() => setDisputeOpen(true)}>
                <AlertTriangle className="h-4 w-4" /> Raise a dispute
              </Button>
              {!['paid', 'cancelled'].includes(order.status) && (
                <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={() => setCancelOpen(true)}>
                  Cancel this order
                </Button>
              )}
              <Button size="sm" variant="ghost" className="w-full" asChild>
                <Link to="/support"><MessageCircle className="h-4 w-4" /> Contact support</Link>
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Keep payments inside ScrapKart where possible. Records here protect both sides if a dispute
            is raised.
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule pickup</DialogTitle>
            <DialogDescription>Both parties are notified once the slot is confirmed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pickDate">Pickup date</Label>
              <Input
                id="pickDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={pickDate}
                onChange={(e) => setPickDate(e.target.value)}
                aria-invalid={!!errors.date}
              />
              {errors.date && <p className="text-xs font-medium text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Time slot</Label>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setPickSlot(s.value)}
                    className={cn(
                      'rounded-xl border p-2 text-left text-xs transition',
                      pickSlot === s.value ? 'border-primary bg-primary/5' : 'border-border',
                    )}
                  >
                    <span className="block font-semibold">{s.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{s.time}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={doSchedule}>Confirm pickup</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as collected</DialogTitle>
            <DialogDescription>
              Enter the weight from your calibrated scale, then choose how the seller wants to be paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="finalWeight">Final weight (kg)</Label>
              <Input
                id="finalWeight"
                type="number"
                step="0.1"
                min={0.1}
                value={finalWeight}
                onChange={(e) => setFinalWeight(e.target.value)}
                aria-invalid={!!errors.weight}
              />
              {errors.weight ? (
                <p className="text-xs font-medium text-destructive">{errors.weight}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Declared {formatWeight(order.declaredWeightKg)} · at {formatCurrency(order.agreedRate)}/kg
                </p>
              )}
            </div>
            <div className="rounded-xl bg-primary/[0.06] p-3">
              <p className="text-xs text-muted-foreground">Payable amount</p>
              <p className="font-display text-2xl font-bold text-primary">
                {formatCurrency(Number(finalWeight || 0) * order.agreedRate)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'upi' as PaymentMode, label: 'UPI', icon: Smartphone },
                  { value: 'razorpay' as PaymentMode, label: 'Card/Net', icon: CreditCard },
                  { value: 'cash' as PaymentMode, label: 'Cash', icon: Banknote },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPayMode(m.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-medium transition',
                      payMode === m.value ? 'border-primary bg-primary/5 text-primary' : 'border-border',
                    )}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCollectOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={doCollect}>Confirm collection</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBuyer ? 'Pay the seller' : 'Confirm payment received'}</DialogTitle>
            <DialogDescription>
              {formatCurrency(order.amount)} for {formatWeight(order.finalWeightKg ?? order.declaredWeightKg)} of{' '}
              {categoryName(order.category, 'en').toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {[
              { value: 'upi' as PaymentMode, label: 'UPI (GPay / PhonePe / Paytm)', icon: Smartphone, hint: 'Instant bank transfer' },
              { value: 'razorpay' as PaymentMode, label: 'Card / Netbanking (Razorpay)', icon: CreditCard, hint: 'Secure payment gateway' },
              { value: 'cash' as PaymentMode, label: 'Cash on pickup', icon: Banknote, hint: 'Mark as settled manually' },
            ].map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setPayMode(m.value)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
                  payMode === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                )}
              >
                <m.icon className={cn('h-5 w-5', payMode === m.value ? 'text-primary' : 'text-muted-foreground')} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
                </span>
                {payMode === m.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </button>
            ))}
            {payMode !== 'cash' && (
              <p className="flex items-start gap-1.5 rounded-lg bg-muted px-2.5 py-2 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Demo mode simulates the Razorpay / UPI confirmation. Add VITE_RAZORPAY_KEY_ID and a
                backend order endpoint to go live.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setPayOpen(false)} disabled={paying}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={doPay} loading={paying}>
              {!paying && <IndianRupee className="h-4 w-4" />} Pay {formatCurrency(order.amount)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a dispute</DialogTitle>
            <DialogDescription>Our team reviews every report within 24 hours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <select
                id="reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                {['Weight mismatch', 'No-show', 'Payment delay', 'Damaged scrap', 'Rude behaviour', 'Other'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="details">What happened?</Label>
              <Textarea id="details" value={disputeDetails} onChange={(e) => setDisputeDetails(e.target.value)} placeholder="Share dates, weights and photos if relevant…" />
              {errors.dispute && <p className="text-xs font-medium text-destructive">{errors.dispute}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => {
                const res = raiseDispute(order.id, disputeReason, disputeDetails);
                if (!res.ok) {
                  setErrors({ dispute: res.error });
                  return;
                }
                toast.success('Dispute submitted', 'Support will contact both parties.');
                setDisputeOpen(false);
                setDisputeDetails('');
              }}
            >
              Submit dispute
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              The listing goes back to the marketplace and the other party is notified. Repeated
              cancellations may affect your rating.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                const res = cancelOrder(order.id, 'Cancelled by ' + (isSeller ? 'seller' : 'dealer'));
                if (!res.ok) return toast.error('Could not cancel', res.error);
                toast.info('Order cancelled');
                setCancelOpen(false);
              }}
            >
              Cancel order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {counterparty?.businessName ?? counterparty?.name}</DialogTitle>
            <DialogDescription>Honest reviews keep ScrapKart trustworthy for everyone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Your rating</Label>
              <div className="mt-1">
                <Stars value={rating} onChange={setRating} size="lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review">Comment</Label>
              <Textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Was the weighing fair? Did they arrive on time?"
              />
              {errors.review && <p className="text-xs font-medium text-destructive">{errors.review}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={doReview}>Submit review</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
