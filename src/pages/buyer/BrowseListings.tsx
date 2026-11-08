import * as React from 'react';
import { Link } from 'react-router-dom';
import { Filter, MapPin, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ListingCard, ListingCardSkeleton } from '@/components/ListingCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { CATEGORIES, categoryName } from '@/data/categories';
import { cn } from '@/lib/utils';
import type { CategorySlug } from '@/lib/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_high', label: 'Highest value' },
  { value: 'price_low', label: 'Lowest value' },
  { value: 'weight_high', label: 'Heaviest first' },
  { value: 'distance', label: 'Nearest to me' },
];

export default function BrowseListings() {
  const { state, currentUser, lang } = useAppStore();
  const [q, setQ] = React.useState('');
  const [categories, setCategories] = React.useState<CategorySlug[]>([]);
  const [maxDistance, setMaxDistance] = React.useState(25);
  const [minWeight, setMinWeight] = React.useState('');
  const [maxWeight, setMaxWeight] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [sort, setSort] = React.useState('newest');
  const [loading, setLoading] = React.useState(true);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Simulate an initial fetch so skeletons are visible & the UI feels real.
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const me = currentUser ? { lat: 21.1458, lng: 79.0882 } : null;

  const distanceOf = (l: { pickup: { lat: number; lng: number } }) => {
    if (!me) return 0;
    const R = 6371;
    const dLat = ((l.pickup.lat - me.lat) * Math.PI) / 180;
    const dLng = ((l.pickup.lng - me.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((me.lat * Math.PI) / 180) * Math.cos((l.pickup.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
  };

  const results = React.useMemo(() => {
    let out = state.listings.filter((l) => l.status === 'listed');
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(
        (l) =>
          l.title.toLowerCase().includes(s) ||
          l.description.toLowerCase().includes(s) ||
          l.pickup.city.toLowerCase().includes(s) ||
          l.pickup.pincode.includes(s),
      );
    }
    if (categories.length) out = out.filter((l) => categories.includes(l.category));
    if (me) out = out.filter((l) => distanceOf(l) <= maxDistance);
    if (minWeight) out = out.filter((l) => l.weightKg >= Number(minWeight));
    if (maxWeight) out = out.filter((l) => l.weightKg <= Number(maxWeight));
    if (maxPrice) out = out.filter((l) => l.estimatedPrice <= Number(maxPrice));

    const sorted = [...out];
    switch (sort) {
      case 'price_high':
        sorted.sort((a, b) => b.estimatedPrice - a.estimatedPrice);
        break;
      case 'price_low':
        sorted.sort((a, b) => a.estimatedPrice - b.estimatedPrice);
        break;
      case 'weight_high':
        sorted.sort((a, b) => b.weightKg - a.weightKg);
        break;
      case 'distance':
        sorted.sort((a, b) => distanceOf(a) - distanceOf(b));
        break;
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [state.listings, q, categories, maxDistance, minWeight, maxWeight, maxPrice, sort]);

  const activeFilterCount =
    categories.length + (minWeight ? 1 : 0) + (maxWeight ? 1 : 0) + (maxPrice ? 1 : 0) + (maxDistance < 25 ? 1 : 0);

  const reset = () => {
    setCategories([]);
    setMinWeight('');
    setMaxWeight('');
    setMaxPrice('');
    setMaxDistance(25);
    setQ('');
    setSort('newest');
  };

  const FiltersBody = () => (
    <div className="space-y-5">
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const active = categories.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() =>
                  setCategories((prev) =>
                    prev.includes(c.slug) ? prev.filter((x) => x !== c.slug) : [...prev, c.slug],
                  )
                }
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                  active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                )}
              >
                <CategoryIcon slug={c.slug} size="sm" withTile={false} />
                {categoryName(c.slug, lang)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Distance — up to {maxDistance} km
        </Label>
        <input
          type="range"
          min={1}
          max={50}
          value={maxDistance}
          onChange={(e) => setMaxDistance(Number(e.target.value))}
          className="mt-2 w-full accent-primary"
          aria-label="Maximum distance in kilometres"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="minW" className="text-xs">Min weight (kg)</Label>
          <Input id="minW" type="number" min={0} value={minWeight} onChange={(e) => setMinWeight(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxW" className="text-xs">Max weight (kg)</Label>
          <Input id="maxW" type="number" min={0} value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} placeholder="Any" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="maxP" className="text-xs">Max listing value (₹)</Label>
        <Input id="maxP" type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" />
      </div>

      <Button variant="outline" className="w-full" onClick={reset}>
        <RefreshCw className="h-4 w-4" /> Reset all filters
      </Button>
    </div>
  );

  return (
    <div>
      {/* Search bar */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plastic, e-waste, area or pincode…"
            className="pl-9 pr-9"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="shrink-0 lg:hidden">
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{activeFilterCount}</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
                <FiltersBody />
                <Button className="mt-4 w-full" onClick={() => setFiltersOpen(false)}>
                  Show {results.length} listings
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </p>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="text-[10px]">{activeFilterCount}</Badge>
              )}
            </div>
            <FiltersBody />
          </div>
        </aside>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Finding scrap near you…' : `${results.length} listing${results.length === 1 ? '' : 's'} available`}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Nagpur · within {maxDistance} km
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No listings match your filters"
              description="Try widening the distance, removing a category filter or clearing the price limit."
              action={<Button variant="outline" onClick={reset}>Reset filters</Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => (
                <ListingCard key={l.id} listing={l} href={`/buyer/listing/${l.id}`} showDistanceFrom={me} />
              ))}
            </div>
          )}

          <div className="mt-6 flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Want more volume? Register for our bulk desk — we aggregate commercial lots above 500 kg in
            your service area.
          </div>
        </div>
      </div>
    </div>
  );
}
