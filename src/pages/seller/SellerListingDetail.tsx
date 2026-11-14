import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Clock,
  Edit3,
  IndianRupee,
  MapPin,
  MessageCircle,
  Scale,
  Star,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
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
import { StatusBadge, StatusTimeline, Stars } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MapView } from '@/components/MapPicker';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { categoryName, co2Saved } from '@/data/categories';
import { cn, formatCurrency, formatDate, formatWeight, timeAgo } from '@/lib/utils';
import type { Offer } from '@/lib/types';

export default function SellerListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, currentUser, lang, acceptOffer, rejectOffer, counterOffer, cancelListing, rateFor } = useAppStore();
  const toast = useToast();

  const listing = state.listings.find((l) => l.id === id);
  const offers = state.offers
    .filter((o) => o.listingId === id)
    .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || b.ratePerKg - a.ratePerKg);
  const [activeImg, setActiveImg] = React.useState(0);
  const [counter, setCounter] = React.useState<Offer | null>(null);
  const [counterRate, setCounterRate] = React.useState('');
  const [cancelOpen, setCancelOpen] = React.useState(false);

  if (!listing) {
    return (
      <EmptyState
        title="Listing not found"
        description="It may have been deleted or you followed an old link."
        action={<Button asChild><Link to="/seller/listings">Back to my listings</Link></Button>}
        className="mt-6"
      />
    );
  }
  if (currentUser?.id !== listing.sellerId) {
    return (
      <EmptyState
        title="This is not your listing"
        description="You can only manage listings created by your account."
        action={<Button asChild><Link to="/seller/listings">My listings</Link></Button>}
        className="mt-6"
      />
    );
  }

  const marketRate = rateFor(listing.category);
  const best = offers.find((o) => o.status === 'pending');
  const editable = ['listed', 'accepted'].includes(listing.status);
  const order = state.orders.find((o) => o.id === listing.orderId);

  const doAccept = (offer: Offer) => {
    const res = acceptOffer(offer.id);
    if (!res.ok) return toast.error('Could not accept offer', res.error);
    toast.success('Offer accepted 🎉', 'Pickup can now be scheduled.');
    navigate(`/seller/orders/${res.data.id}`);
  };

  const doReject = (offer: Offer) => {
    const res = rejectOffer(offer.id);
    if (!res.ok) return toast.error('Could not decline', res.error);
    toast.info('Offer declined');
  };

  const doCounter = () => {
    if (!counter) return;
    const rate = Number(counterRate);
    const res = counterOffer(counter.id, rate);
    if (!res.ok) return toast.error('Could not send counter', res.error);
    toast.success('Counter offer sent', `You proposed ₹${rate}/kg`);
    setCounter(null);
    setCounterRate('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/seller/listings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All listings
        </Link>
        <div className="flex gap-2">
          {editable && (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/seller/listings/${listing.id}/edit`}><Edit3 className="h-4 w-4" /> Edit</Link>
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancelOpen(true)}>
                Cancel listing
              </Button>
            </>
          )}
          {order && (
            <Button size="sm" asChild>
              <Link to={`/seller/orders/${order.id}`}>View order <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* Left: listing */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            {listing.images.length ? (
              <>
                <div className="relative aspect-[16/10] bg-muted">
                  <img src={listing.images[activeImg]} alt={listing.title} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={listing.status} />
                  </div>
                </div>
                {listing.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-2">
                    {listing.images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={cn(
                          'h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition',
                          i === activeImg ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                        )}
                      >
                        <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid aspect-[16/10] place-items-center bg-secondary">
                <CategoryIcon slug={listing.category} size="lg" />
              </div>
            )}

            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CategoryIcon slug={listing.category} size="sm" withTile={false} className="text-primary" />
                {categoryName(listing.category, lang)} · {listing.condition}
              </div>
              <h1 className="font-display text-xl font-bold">{listing.title}</h1>
              {listing.description && <p className="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>}

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
                  <dt className="text-[11px] text-muted-foreground">Your asking</dt>
                  <dd className="font-semibold">{listing.askingPrice ? `₹${listing.askingPrice}/kg` : 'Market'}</dd>
                </div>
              </dl>

              <div className="rounded-xl bg-secondary/50 p-3">
                <StatusTimeline current={listing.status} kind="listing" />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Preferred pickup {formatDate(listing.preferredDate)} ·{' '}
                {listing.preferredSlot === 'morning' ? '9 am – 12 pm' : listing.preferredSlot === 'afternoon' ? '12 – 4 pm' : '4 – 7 pm'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="mb-2 font-display text-sm font-semibold">Pickup location</h2>
            <MapView lat={listing.pickup.lat} lng={listing.pickup.lng} height={180} label={listing.pickup.address} />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /> {listing.pickup.address}, {listing.pickup.city} – {listing.pickup.pincode}
            </p>
          </div>
        </div>

        {/* Right: offers */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">
                Offers <span className="text-muted-foreground">({offers.length})</span>
              </h2>
              {best && (
                <Badge variant="success">
                  <TrendingUp className="h-3 w-3" /> Best ₹{best.ratePerKg}/kg
                </Badge>
              )}
            </div>

            {offers.length === 0 ? (
              <EmptyState icon={IndianRupee} title="No offers yet" description="Dealers nearby have been notified. Offers usually arrive within a few hours." className="mt-3 border-0 py-8" />
            ) : (
              <ul className="mt-3 space-y-2.5">
                {offers.map((o) => {
                  const buyer = state.users.find((u) => u.id === o.buyerId);
                  const diff = o.ratePerKg - marketRate;
                  const isBest = best?.id === o.id;
                  return (
                    <li
                      key={o.id}
                      className={cn(
                        'rounded-xl border p-3 transition',
                        isBest ? 'border-primary/50 bg-primary/[0.04]' : 'border-border',
                        o.status !== 'pending' && 'opacity-70',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{buyer?.businessName ?? buyer?.name}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Stars value={Math.round(buyer?.rating ?? 0)} size="sm" />
                            {buyer?.rating?.toFixed(1) ?? 'New'} · {buyer?.completedOrders ?? 0} pickups
                          </div>
                        </div>
                        <StatusBadge status={o.status} withDot={false} />
                      </div>

                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <p className="font-display text-lg font-bold">{formatCurrency(o.ratePerKg)}<span className="text-xs font-normal text-muted-foreground">/kg</span></p>
                          <p className="text-[11px] text-muted-foreground">
                            ≈ {formatCurrency(o.amount)} for {formatWeight(listing.weightKg)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                            diff >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                          )}
                        >
                          {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {diff >= 0 ? '+' : ''}
                          {formatCurrency(diff)} vs market
                        </span>
                      </div>

                      {o.message && <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">"{o.message}"</p>}
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        Can pick up {formatDate(o.pickupDate)} · sent {timeAgo(o.createdAt)}
                      </p>

                      {o.status === 'pending' && (
                        <div className="mt-2.5 flex gap-1.5">
                          <Button size="sm" className="flex-1" onClick={() => doAccept(o)}>
                            <Check className="h-3.5 w-3.5" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setCounter(o);
                              setCounterRate(String(Math.round((o.ratePerKg + marketRate) / 2)));
                            }}
                          >
                            Counter
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => doReject(o)} aria-label="Decline offer">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      {o.status === 'accepted' && order && (
                        <Button size="sm" variant="secondary" className="mt-2 w-full" asChild>
                          <Link to={`/seller/orders/${order.id}`}>Manage pickup</Link>
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="mb-2 font-display text-sm font-semibold">Listing stats</h2>
            <ul className="space-y-1.5 text-xs">
              {[
                ['Views', String(listing.views)],
                ['Offers received', String(offers.length)],
                ['CO₂ saved when recycled', `${co2Saved(listing.weightKg, listing.category)} kg`],
                ['Published', formatDate(listing.createdAt)],
                ['Last updated', formatDate(listing.updatedAt)],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          {best && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-500/25 dark:bg-amber-500/10">
              <p className="font-semibold text-amber-900 dark:text-amber-200">Tip</p>
              <p className="mt-1 text-amber-800/80 dark:text-amber-200/70">
                You have {offers.filter((o) => o.status === 'pending').length} live offer(s). Waiting a few
                hours often brings a better price for clean, well-photographed lots.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Counter dialog */}
      <Dialog open={!!counter} onOpenChange={(o) => !o && setCounter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a counter offer</DialogTitle>
            <DialogDescription>
              Current offer is {formatCurrency(counter?.ratePerKg ?? 0)}/kg. Today's market rate is{' '}
              {formatCurrency(marketRate)}/kg.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="counter">Your rate per kg (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="counter"
                type="number"
                className="pl-9"
                value={counterRate}
                onChange={(e) => setCounterRate(e.target.value)}
                min={1}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated total: {formatCurrency(Number(counterRate || 0) * listing.weightKg)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCounter(null)}>Cancel</Button>
            <Button className="flex-1" onClick={doCounter}>Send counter offer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel listing dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this listing?</DialogTitle>
            <DialogDescription>
              "{listing.title}" will be removed and all pending offers withdrawn.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>Keep it</Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                const res = cancelListing(listing.id);
                if (!res.ok) return toast.error('Could not cancel', res.error);
                toast.success('Listing cancelled');
                navigate('/seller/listings');
              }}
            >
              Yes, cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
