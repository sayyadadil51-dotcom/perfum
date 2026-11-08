import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  Handshake,
  IndianRupee,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Truck,
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
import { StatusBadge, Stars } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MapView } from '@/components/MapPicker';
import { ChatPanel } from '@/components/ChatPanel';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { categoryName, co2Saved } from '@/data/categories';
import { cn, distanceKm, formatCurrency, formatDate, formatWeight, timeAgo } from '@/lib/utils';

export default function BuyerListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, currentUser, lang, createOffer, acceptListingAtRate, rateFor } = useAppStore();
  const toast = useToast();

  const listing = state.listings.find((l) => l.id === id);
  const [activeImg, setActiveImg] = React.useState(0);
  const [offerOpen, setOfferOpen] = React.useState(false);
  const [acceptOpen, setAcceptOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [rate, setRate] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [pickupDate, setPickupDate] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (listing) {
      setRate(String(rateFor(listing.category)));
      setPickupDate(listing.preferredDate);
      setMessage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (!listing) {
    return (
      <EmptyState
        title="Listing not found"
        description="It may have been sold or withdrawn."
        action={<Button asChild><Link to="/buyer">Browse listings</Link></Button>}
        className="mt-6"
      />
    );
  }

  const seller = state.users.find((u) => u.id === listing.sellerId);
  const myOffer = state.offers.find(
    (o) => o.listingId === listing.id && o.buyerId === currentUser?.id && o.status === 'pending',
  );
  const marketRate = rateFor(listing.category);
  const dist = currentUser ? distanceKm({ lat: 21.1458, lng: 79.0882 }, listing.pickup) : null;
  const available = listing.status === 'listed';
  const canBid = currentUser?.verificationStatus === 'approved';

  const submitOffer = () => {
    const r = Number(rate);
    const next: Record<string, string> = {};
    if (!(r > 0)) next.rate = 'Enter your rate per kg';
    if (!pickupDate) next.date = 'Choose a pickup date';
    setErrors(next);
    if (Object.keys(next).length) return;
    const res = createOffer({ listingId: listing.id, ratePerKg: r, message, pickupDate });
    if (!res.ok) {
      setErrors({ form: res.error });
      return;
    }
    toast.success('Offer sent 🎉', 'The seller will be notified right away.');
    setOfferOpen(false);
  };

  const acceptNow = () => {
    const res = acceptListingAtRate(listing.id, Number(rate) || marketRate);
    if (!res.ok) return toast.error('Could not accept', res.error);
    toast.success('Listing accepted', 'Schedule the pickup from your orders page.');
    navigate(`/buyer/orders/${res.data.id}`);
  };

  return (
    <div>
      <Link to="/buyer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="relative aspect-[16/10] bg-muted">
              {listing.images[activeImg] ? (
                <img src={listing.images[activeImg]} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-secondary">
                  <CategoryIcon slug={listing.category} size="lg" />
                </div>
              )}
              <div className="absolute left-3 top-3 flex gap-2">
                <StatusBadge status={listing.status} />
              </div>
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                <Eye className="h-3 w-3" /> {listing.views} views
              </span>
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-2">
                {listing.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition',
                      i === activeImg ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                    )}
                    aria-label={`Photo ${i + 1}`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CategoryIcon slug={listing.category} size="sm" withTile={false} className="text-primary" />
                {categoryName(listing.category, lang)} · {listing.condition}
              </div>
              <h1 className="font-display text-xl font-bold">{listing.title}</h1>
              {listing.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
              )}

              <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-[11px] text-muted-foreground">Weight</dt>
                  <dd className="font-semibold">{formatWeight(listing.weightKg)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Est. value</dt>
                  <dd className="font-semibold text-primary">{formatCurrency(listing.estimatedPrice)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Market rate</dt>
                  <dd className="font-semibold">₹{marketRate}/kg</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Distance</dt>
                  <dd className="font-semibold">{dist ?? '—'} km</dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" /> Preferred {formatDate(listing.preferredDate)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  {listing.preferredSlot === 'morning' ? '9 am – 12 pm' : listing.preferredSlot === 'afternoon' ? '12 – 4 pm' : '4 – 7 pm'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {listing.pickup.city} – {listing.pickup.pincode}
                </span>
                <span>Listed {timeAgo(listing.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="mb-2 font-display text-sm font-semibold">Approximate pickup area</h2>
            <MapView
              lat={listing.pickup.lat}
              lng={listing.pickup.lng}
              height={200}
              label="Exact address is shared after the deal is confirmed"
            />
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated value</p>
            <p className="font-display text-3xl font-extrabold text-primary">{formatCurrency(listing.estimatedPrice)}</p>
            <p className="text-xs text-muted-foreground">
              {formatWeight(listing.weightKg)} at {formatCurrency(listing.askingPrice ?? marketRate)}/kg
              {listing.askingPrice ? ' (seller asking)' : ' (live rate)'}
            </p>

            <div className="mt-4 space-y-2">
              {available ? (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      setRate(String(listing.askingPrice ?? marketRate));
                      setOfferOpen(true);
                    }}
                    disabled={!canBid}
                  >
                    <Handshake className="h-5 w-5" /> Send an offer
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setRate(String(listing.askingPrice ?? marketRate));
                      setAcceptOpen(true);
                    }}
                    disabled={!canBid}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Accept at asking price
                  </Button>
                </>
              ) : (
                <div className="rounded-xl bg-muted p-3 text-center text-sm text-muted-foreground">
                  This listing is no longer open for offers.
                </div>
              )}
              <Button variant="ghost" className="w-full" onClick={() => setChatOpen(true)} disabled={!canBid}>
                <MessageCircle className="h-4 w-4" /> Ask the seller a question
              </Button>
            </div>

            {!canBid && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Your dealer account is pending admin approval. Offers unlock once verified.
              </p>
            )}
            {myOffer && (
              <div className="mt-3 rounded-xl border border-primary/30 bg-primary/[0.05] p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Your pending offer
                </p>
                <p className="mt-1 text-sm font-bold">{formatCurrency(myOffer.ratePerKg)}/kg</p>
                <p className="text-[11px] text-muted-foreground">
                  ≈ {formatCurrency(myOffer.amount)} · pickup {formatDate(myOffer.pickupDate)} · sent {timeAgo(myOffer.createdAt)}
                </p>
              </div>
            )}
          </div>

          {/* Seller card */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="font-display text-sm font-semibold">About the seller</h2>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-leaf-700">
                {seller?.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </span>
              <div>
                <p className="text-sm font-semibold">{seller?.name}</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Stars value={Math.round(seller?.rating ?? 0)} size="sm" />
                  {seller?.rating?.toFixed(1) ?? 'New'} · {seller?.completedOrders ?? 0} completed
                </div>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Phone verified seller</li>
              <li className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-primary" /> Member since {formatDate(seller?.createdAt ?? listing.createdAt)}</li>
              <li className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Recycling saves {co2Saved(listing.weightKg, listing.category)} kg CO₂</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 text-xs shadow-soft">
            <p className="font-semibold">Good to know</p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li>• Weighing happens at the seller's location on your scale</li>
              <li>• You can settle by UPI, Razorpay or cash</li>
              <li>• Sellers rate you after every pickup</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chat drawer */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-xl p-0">
          <div className="p-4 pb-0">
            <DialogHeader>
              <DialogTitle>Chat about this listing</DialogTitle>
              <DialogDescription>Messages are visible to ScrapKart support if a dispute is raised.</DialogDescription>
            </DialogHeader>
          </div>
          <ChatPanel listingId={listing.id} otherUserId={seller!.id} height={330} compact />
        </DialogContent>
      </Dialog>

      {/* Offer dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send an offer</DialogTitle>
            <DialogDescription>
              {formatWeight(listing.weightKg)} of {categoryName(listing.category, 'en').toLowerCase()} ·
              today's market rate {formatCurrency(marketRate)}/kg
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rate">Your rate per kg (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="rate"
                  type="number"
                  className="pl-9"
                  min={1}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  aria-invalid={!!errors.rate}
                />
              </div>
              {errors.rate && <p className="text-xs font-medium text-destructive">{errors.rate}</p>}
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                Total ≈ <strong>{formatCurrency(Number(rate || 0) * listing.weightKg)}</strong>
                {Number(rate) > 0 && (
                  <span
                    className={cn(
                      'ml-1 inline-flex items-center gap-0.5 font-semibold',
                      Number(rate) >= marketRate ? 'text-emerald-600' : 'text-amber-600',
                    )}
                  >
                    {Number(rate) >= marketRate ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {(((Number(rate) - marketRate) / marketRate) * 100).toFixed(1)}% vs market
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pickDate">Pickup date you can commit to</Label>
              <Input
                id="pickDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                aria-invalid={!!errors.date}
              />
              {errors.date && <p className="text-xs font-medium text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg">Message to seller <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. I can send two helpers and a tempo. Rate is for washed PET only."
                maxLength={240}
              />
            </div>
            <p className="flex items-start gap-1.5 rounded-lg bg-muted px-2.5 py-2 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The seller can accept, counter or decline. Nothing is committed until they accept.
            </p>
            {errors.form && <p className="text-xs font-medium text-destructive">{errors.form}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOfferOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={submitOffer} disabled={!!myOffer}>
              {myOffer ? 'Offer already sent' : 'Send offer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accept dialog */}
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept this listing?</DialogTitle>
            <DialogDescription>
              You agree to pay {formatCurrency(Number(rate || marketRate) * listing.weightKg)} for{' '}
              {formatWeight(listing.weightKg)} and collect it on {formatDate(listing.preferredDate)}.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-primary/[0.06] p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-semibold">{formatCurrency(Number(rate) || marketRate)}/kg</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Estimated total</span>
              <span className="font-display text-base font-bold text-primary">
                {formatCurrency((Number(rate) || marketRate) * listing.weightKg)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setAcceptOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={acceptNow}>Confirm & create order</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
