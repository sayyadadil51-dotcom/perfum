import * as React from 'react';
import { Link } from 'react-router-dom';
import { Eye, MapPin, Scale, Truck } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { categoryName } from '@/data/categories';
import { cn, distanceKm, formatCurrency, formatWeight, timeAgo } from '@/lib/utils';
import type { Listing } from '@/lib/types';
import { useAppStore } from '@/context/AppStore';

const CONDITION_LABEL: Record<string, string> = { clean: 'Clean', mixed: 'Mixed', dirty: 'Dirty' };
const CONDITION_STYLE: Record<string, string> = {
  clean: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  mixed: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  dirty: 'bg-stone-100 text-stone-700 dark:bg-stone-500/15 dark:text-stone-300',
};

export function ListingCard({
  listing,
  href,
  showDistanceFrom,
  className,
}: {
  listing: Listing;
  href?: string;
  showDistanceFrom?: { lat: number; lng: number } | null;
  className?: string;
}) {
  const { lang, rateFor } = useAppStore();
  const marketRate = rateFor(listing.category);
  const askingRate = listing.askingPrice ?? marketRate;
  const isGoodDeal = listing.askingPrice !== null && askingRate < marketRate;
  const dist = showDistanceFrom ? distanceKm(showDistanceFrom, listing.pickup) : null;
  const to = href ?? `/listing/${listing.id}`;

  return (
    <Link
      to={to}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <CategoryIcon slug={listing.category} size="lg" />
          </div>
        )}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <StatusBadge status={listing.status} withDot={false} className="bg-white/90 backdrop-blur dark:bg-forest-900/80" />
          {listing.images.length > 1 && (
            <Badge variant="secondary" className="bg-black/55 text-white backdrop-blur">
              {listing.images.length} photos
            </Badge>
          )}
        </div>
        <div className="absolute inset-x-2 bottom-2 flex flex-wrap gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', CONDITION_STYLE[listing.condition])}>
            {CONDITION_LABEL[listing.condition]}
          </span>
          {isGoodDeal && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              Below market
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <CategoryIcon slug={listing.category} size="sm" withTile={false} className="text-primary" />
          {categoryName(listing.category, lang)}
        </div>

        <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug transition-colors group-hover:text-primary">
          {listing.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Scale className="h-3.5 w-3.5" /> {formatWeight(listing.weightKg)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {dist !== null ? `${dist} km` : listing.pickup.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" /> {timeAgo(listing.createdAt)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/60 pt-2.5">
          <div>
            <p className="font-display text-lg font-bold leading-none text-primary">
              {formatCurrency(listing.estimatedPrice)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              ≈ {formatCurrency(askingRate)}/kg
              {listing.askingPrice !== null ? ' · asking' : ' · live rate'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> {listing.views}
            {listing.offerCount > 0 && (
              <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 font-semibold text-secondary-foreground">
                {listing.offerCount} {listing.offerCount === 1 ? 'offer' : 'offers'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Skeleton used while listings "load". */
export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-3/4" />
        <div className="flex justify-between pt-2">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-4 w-12" />
        </div>
      </div>
    </div>
  );
}
