import * as React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  Eye,
  IndianRupee,
  Leaf,
  MapPin,
  MessageCircle,
  Package,
  Share2,
  ShieldCheck,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, Stars } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MapView } from '@/components/MapPicker';
import { ChatPanel } from '@/components/ChatPanel';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/ui/misc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_MAP, co2Saved, categoryName } from '@/data/categories';
import { cn, formatCurrency, formatDate, formatWeight, timeAgo } from '@/lib/utils';

/** Public listing page — visible to anyone, with contextual CTAs per role. */
export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, currentUser, lang, rateFor } = useAppStore();
  const toast = useToast();
  const [activeImg, setActiveImg] = React.useState(0);
  const [chatOpen, setChatOpen] = React.useState(false);

  const listing = state.listings.find((l) => l.id === id);
  if (!listing) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Listing not found"
          description="It may have been sold, cancelled or the link is incorrect."
          action={<Button asChild><Link to="/rates">See today's rates</Link></Button>}
        />
      </div>
    );
  }

  const seller = state.users.find((u) => u.id === listing.sellerId);
  const rate = rateFor(listing.category);
  const co2 = co2Saved(listing.weightKg, listing.category);
  const related = state.listings
    .filter((l) => l.id !== listing.id && l.status === 'listed' && l.category === listing.category)
    .slice(0, 3);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const isOwner = currentUser?.id === listing.sellerId;

  return (
    <div className="container py-6 lg:py-10">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mt-3 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
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
                <Badge variant="secondary" className="bg-black/55 text-white capitalize backdrop-blur">{listing.condition}</Badge>
              </div>
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                <Eye className="h-3 w-3" /> {listing.views}
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
                {categoryName(listing.category, lang)}
              </div>
              <h1 className="font-display text-2xl font-extrabold">{listing.title}</h1>
              {listing.description && <p className="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>}

              <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-[11px] text-muted-foreground">Weight</dt>
                  <dd className="font-semibold">{formatWeight(listing.weightKg)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Live rate</dt>
                  <dd className="font-semibold">{formatCurrency(rate)}/kg</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Est. value</dt>
                  <dd className="font-semibold text-primary">{formatCurrency(listing.estimatedPrice)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Photos</dt>
                  <dd className="font-semibold">{listing.images.length}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Prefers {formatDate(listing.preferredDate)}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {listing.pickup.city} – {listing.pickup.pincode}</span>
                <span>Listed {timeAgo(listing.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="mb-2 font-display text-sm font-semibold">Approximate location</h2>
            <MapView lat={listing.pickup.lat} lng={listing.pickup.lng} height={200} label="Exact address shared with the accepted dealer only" />
          </div>

          {related.length > 0 && (
            <div>
              <h2 className="mb-2 font-display text-base font-semibold">Similar scrap nearby</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {related.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated value</p>
            <p className="font-display text-3xl font-extrabold text-primary">{formatCurrency(listing.estimatedPrice)}</p>
            <p className="text-xs text-muted-foreground">
              {formatWeight(listing.weightKg)} × {formatCurrency(listing.askingPrice ?? rate)}/kg
            </p>

            <div className="mt-4 space-y-2">
              {isOwner ? (
                <Button className="w-full" asChild>
                  <Link to={`/seller/listings/${listing.id}`}>Manage my listing</Link>
                </Button>
              ) : currentUser?.role === 'buyer' ? (
                <Button className="w-full" onClick={() => navigate(`/buyer/listing/${listing.id}`)}>
                  <IndianRupee className="h-4 w-4" /> Send an offer
                </Button>
              ) : currentUser?.role === 'seller' ? (
                <p className="rounded-xl bg-muted p-3 text-center text-xs text-muted-foreground">
                  You are signed in as a seller. Dealers send offers on listings like this.
                </p>
              ) : (
                <>
                  <Button className="w-full" asChild>
                    <Link to={`/signup?role=buyer&ref=${''}`}>Join as dealer to bid</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/signup">Sell your own scrap</Link>
                  </Button>
                </>
              )}
              <Button variant="ghost" className="w-full" onClick={share}>
                <Share2 className="h-4 w-4" /> Share listing
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="font-display text-sm font-semibold">Seller</h2>
            <div className="mt-2 flex items-center gap-3">
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
            {currentUser?.role === 'buyer' && seller && (
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setChatOpen(true)}>
                <MessageCircle className="h-3.5 w-3.5" /> Ask a question
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              <Leaf className="h-4 w-4" /> Environmental impact
            </p>
            <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/70">
              Recycling this lot saves an estimated <strong>{co2} kg CO₂</strong> — about the emissions of
              driving {Math.round(co2 / 0.192)} km in a petrol car.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 text-xs shadow-soft">
            <p className="flex items-center gap-1.5 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Safe trading tips</p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li>• Never share OTPs or bank details in chat</li>
              <li>• Confirm the weight in front of you at pickup</li>
              <li>• Prefer in-app payments for a paper trail</li>
            </ul>
          </div>
        </div>
      </div>

      {seller && (
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="max-w-xl p-0">
            <div className="p-4 pb-0">
              <DialogHeader>
                <DialogTitle>Ask about this listing</DialogTitle>
                <DialogDescription>Keep negotiations in chat so support can help if needed.</DialogDescription>
              </DialogHeader>
            </div>
            <ChatPanel listingId={listing.id} otherUserId={seller.id} height={320} compact />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
