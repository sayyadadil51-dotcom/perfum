import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Coins,
  IndianRupee,
  Info,
  MapPin,
  Package,
  Scale,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon, CategoryTile } from '@/components/CategoryIcon';
import { ImageUploader } from '@/components/ImageUploader';
import { MapPicker } from '@/components/MapPicker';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { CATEGORIES, categoryName, co2Saved } from '@/data/categories';
import type { CategorySlug, Condition, GeoPoint, TimeSlot } from '@/lib/types';
import { cn, formatCurrency, formatWeight } from '@/lib/utils';

const SLOTS: { value: TimeSlot; label: string; time: string }[] = [
  { value: 'morning', label: 'Morning', time: '9 am – 12 pm' },
  { value: 'afternoon', label: 'Afternoon', time: '12 – 4 pm' },
  { value: 'evening', label: 'Evening', time: '4 – 7 pm' },
];

const CONDITIONS: { value: Condition; label: string; desc: string; multiplier: string }[] = [
  { value: 'clean', label: 'Clean', desc: 'Rinsed, sorted, free of tape/labels', multiplier: '+10–25% rate' },
  { value: 'mixed', label: 'Mixed', desc: 'Mostly clean with some contamination', multiplier: 'Market rate' },
  { value: 'dirty', label: 'Dirty', desc: 'Unwashed, taped or unsorted', multiplier: '−10–20% rate' },
];

const STEPS = ['Category', 'Details', 'Photos & address', 'Pickup', 'Price', 'Review'] as const;

export default function NewListing() {
  const { state, currentUser, createListing, rateFor, lang } = useAppStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [category, setCategory] = React.useState<CategorySlug | null>(null);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [condition, setCondition] = React.useState<Condition>('mixed');
  const [images, setImages] = React.useState<string[]>([]);
  const [address, setAddress] = React.useState('');
  const [city, setCity] = React.useState(currentUser?.city ?? 'Nagpur');
  const [pincode, setPincode] = React.useState('');
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>({ lat: 21.1458, lng: 79.0882 });
  const [date, setDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [slot, setSlot] = React.useState<TimeSlot>('morning');
  const [priceMode, setPriceMode] = React.useState<'market' | 'custom'>('market');
  const [askingPrice, setAskingPrice] = React.useState('');

  const weightNum = Number(weight) || 0;
  const marketRate = category ? rateFor(category) : 0;
  const customRate = Number(askingPrice) || 0;
  const activeRate = priceMode === 'custom' ? customRate : marketRate;
  const estimate = Math.round(weightNum * activeRate);
  const minDate = new Date().toISOString().slice(0, 10);

  // Auto-fill a sensible title when a category and weight are picked.
  React.useEffect(() => {
    if (category && !title) {
      const cat = CATEGORIES.find((c) => c.slug === category);
      if (cat) setTitle(`${weightNum || ''} kg ${cat.name.toLowerCase()} scrap`.replace(/^ kg/, '').trim());
    }
  }, [category, weightNum, title]);

  const validate = (targetStep: number): boolean => {
    const next: Record<string, string> = {};
    if (targetStep === 0 && !category) next.category = 'Choose the type of scrap you are selling';
    if (targetStep === 1) {
      if (!title.trim() || title.trim().length < 4) next.title = 'Add a short title (min 4 characters)';
      if (!(weightNum > 0)) next.weight = 'Enter the approximate weight in kg';
      if (weightNum > 50000) next.weight = 'For over 50 tonnes, please contact our bulk desk';
      if (!condition) next.condition = 'Choose the condition';
    }
    if (targetStep === 2) {
      if (images.length === 0) next.images = 'Add at least one clear photo';
      if (!address.trim() || address.trim().length < 8) next.address = 'Enter your full pickup address';
      if (!/^\d{6}$/.test(pincode)) next.pincode = 'Enter a valid 6-digit pincode';
      if (!coords) next.coords = 'Drop a pin on the map';
    }
    if (targetStep === 3) {
      if (!date) next.date = 'Choose a preferred pickup date';
      if (new Date(date) < new Date(minDate)) next.date = 'Pickup date cannot be in the past';
    }
    if (targetStep === 4 && priceMode === 'custom') {
      if (!(customRate > 0)) next.askingPrice = 'Enter your asking price per kg';
      else if (customRate > marketRate * 3)
        next.askingPrice = `That is more than 3× today's rate (₹${marketRate}/kg). Dealers are unlikely to accept.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validate(step)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = () => {
    if (!validate(4)) return;
    if (!validate(1) || !validate(2) || !validate(3)) {
      toast.error('Some details are missing', 'Please go back and complete the highlighted fields.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const pickup: GeoPoint = {
        lat: coords?.lat ?? 21.1458,
        lng: coords?.lng ?? 79.0882,
        address: address.trim(),
        city: city.trim(),
        pincode,
      };
      const res = createListing({
        category: category!,
        title: title.trim(),
        description: description.trim(),
        weightKg: weightNum,
        condition,
        images,
        pickup,
        preferredDate: date,
        preferredSlot: slot,
        askingPrice: priceMode === 'custom' ? customRate : null,
      });
      setLoading(false);
      if (!res.ok) {
        toast.error('Could not publish listing', res.error);
        setErrors({ form: res.error });
        return;
      }
      toast.success('Listing published 🎉', 'Verified dealers nearby have been notified.');
      navigate(`/seller/listings/${res.data.id}`);
    }, 800);
  };

  /* Guard: only sellers can list. */
  if (currentUser?.role !== 'seller') {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Seller accounts only</h1>
        <p className="mt-2 text-sm text-muted-foreground">Switch to a seller account to list scrap.</p>
        <Button asChild className="mt-4"><Link to="/signup">Create seller account</Link></Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 lg:py-10">
      <div className="flex items-center justify-between gap-3">
        <Link to="/seller" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <Badge variant="success">Free to list</Badge>
      </div>

      <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Sell your scrap</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < step ? 'bg-primary' : i === step ? 'bg-primary/60' : 'bg-border',
              )}
              title={s}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                'hidden text-[10px] font-medium sm:block',
                i === step ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-6">
          {/* ── Step 0: category ── */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-lg font-semibold">What are you selling?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the closest match. Mixed loads? Pick the dominant material — you can mention the rest in the description.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {CATEGORIES.filter((c) => c.active).map((c) => (
                  <CategoryTile
                    key={c.slug}
                    category={c}
                    lang={lang}
                    selected={category === c.slug}
                    onClick={() => {
                      setCategory(c.slug);
                      setErrors({});
                    }}
                  />
                ))}
              </div>
              {errors.category && <p className="mt-2 text-xs font-medium text-destructive">{errors.category}</p>}
              {category && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Today's {categoryName(category, 'en')} rate is <strong>₹{marketRate}/kg</strong>. A{' '}
                    {weightNum ? formatWeight(weightNum) : 'typical 20 kg'} lot is worth about{' '}
                    <strong>{formatCurrency((weightNum || 20) * marketRate)}</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: details ── */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Tell us about the scrap</h2>
                <p className="mt-1 text-sm text-muted-foreground">Accurate weight gets you accurate offers.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Listing title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 24 kg PET bottles, rinsed"
                  aria-invalid={!!errors.title}
                  maxLength={80}
                />
                {errors.title ? (
                  <p className="text-xs font-medium text-destructive">{errors.title}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{title.length}/80 characters</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Approximate weight (kg)</Label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="weight"
                      type="number"
                      inputMode="decimal"
                      min={1}
                      step="0.5"
                      className="pl-9 pr-12"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="24"
                      aria-invalid={!!errors.weight}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">kg</span>
                  </div>
                  {errors.weight ? (
                    <p className="text-xs font-medium text-destructive">{errors.weight}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {[5, 10, 25, 50, 100].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setWeight(String(q))}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                        >
                          {q} kg
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Condition</Label>
                  <div className="space-y-1.5">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCondition(c.value)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-xl border p-2 text-left transition',
                          condition === c.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-4 w-4 shrink-0 place-items-center rounded-full border-2',
                            condition === c.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                          )}
                        >
                          {condition === c.value && <Check className="h-2.5 w-2.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold">{c.label}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">{c.desc}</span>
                        </span>
                        <span className="shrink-0 text-[10px] font-medium text-primary">{c.multiplier}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anything the dealer should know — quantity split, access, whether help is available to load…"
                  maxLength={400}
                />
                <p className="text-xs text-muted-foreground">{description.length}/400</p>
              </div>
            </div>
          )}

          {/* ── Step 2: photos & address ── */}
          {step === 2 && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold">Photos & pickup location</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Listings with photos get up to 3× more offers.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Photos (up to 5)</Label>
                <ImageUploader images={images} onChange={setImages} onError={(m) => toast.error('Photo issue', m)} />
                {errors.images && <p className="text-xs font-medium text-destructive">{errors.images}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Pickup address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat / shop number, building, street, landmark"
                  aria-invalid={!!errors.address}
                  className="min-h-[70px]"
                />
                {errors.address && <p className="text-xs font-medium text-destructive">{errors.address}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pin">Pincode</Label>
                  <Input
                    id="pin"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="440010"
                    aria-invalid={!!errors.pincode}
                  />
                  {errors.pincode && <p className="text-xs font-medium text-destructive">{errors.pincode}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Drop a pin for the pickup spot
                </Label>
                <MapPicker
                  value={coords}
                  onChange={(lat, lng) => {
                    setCoords({ lat, lng });
                    setErrors((e) => ({ ...e, coords: '' }));
                  }}
                />
                {errors.coords && <p className="text-xs font-medium text-destructive">{errors.coords}</p>}
                <p className="text-[11px] text-muted-foreground">
                  Your exact pin is shared only with the dealer whose offer you accept.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: pickup slot ── */}
          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">When should we pick it up?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is your preference — the dealer confirms the final slot before pickup.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Preferred date</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-9"
                    min={minDate}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-invalid={!!errors.date}
                  />
                </div>
                {errors.date && <p className="text-xs font-medium text-destructive">{errors.date}</p>}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[0, 1, 2, 3, 5].map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const iso = d.toISOString().slice(0, 10);
                    return (
                      <button
                        key={offset}
                        type="button"
                        onClick={() => setDate(iso)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                          date === iso ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Preferred time slot</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {SLOTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSlot(s.value)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition',
                        slot === s.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                      )}
                    >
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-[11px] text-muted-foreground">{s.time}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Dealers usually arrive within the slot. You will get an SMS + in-app notification when
                the pickup is confirmed.
              </div>
            </div>
          )}

          {/* ── Step 4: pricing ── */}
          {step === 4 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Set your price</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the live market rate, or ask for your own price per kg and let dealers negotiate.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPriceMode('market')}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left transition',
                    priceMode === 'market' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="success" className="text-[10px]">Recommended</Badge>
                    {priceMode === 'market' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-2 text-sm font-semibold">Use live market rate</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{marketRate}/kg today · ≈ {formatCurrency(weightNum * marketRate)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPriceMode('custom')}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left transition',
                    priceMode === 'custom' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">Negotiable</Badge>
                    {priceMode === 'custom' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-2 text-sm font-semibold">Set my asking price</p>
                  <p className="text-xs text-muted-foreground">Dealers can accept, or send a counter offer</p>
                </button>
              </div>

              {priceMode === 'custom' && (
                <div className="space-y-1.5 animate-fade-in">
                  <Label htmlFor="asking">Asking price per kg (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="asking"
                      type="number"
                      inputMode="decimal"
                      min={1}
                      className="pl-9"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      placeholder={String(marketRate)}
                      aria-invalid={!!errors.askingPrice}
                    />
                  </div>
                  {errors.askingPrice && <p className="text-xs font-medium text-destructive">{errors.askingPrice}</p>}
                  <p className="text-xs text-muted-foreground">
                    Today's market rate is ₹{marketRate}/kg. Asking above that may slow down offers.
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-primary/25 bg-primary/[0.05] p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Coins className="h-3.5 w-3.5" /> Estimated payout
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold">{formatCurrency(estimate)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatWeight(weightNum)} × {formatCurrency(activeRate)}/kg — final amount is based on
                  weighing at pickup.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" /> Recycling this saves ≈ {co2Saved(weightNum, category ?? 'other')} kg CO₂
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: review ── */}
          {step === 5 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Review & publish</h2>
                <p className="mt-1 text-sm text-muted-foreground">Check the details before dealers see it.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border">
                {images[0] ? (
                  <img src={images[0]} alt="Cover" className="aspect-[2/1] w-full object-cover" />
                ) : (
                  <div className="grid aspect-[2/1] w-full place-items-center bg-secondary">
                    <Package className="h-10 w-10 text-leaf-600" />
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <CategoryIcon slug={category!} size="sm" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {categoryName(category!, lang)} · {condition}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold">{title}</h3>
                  {description && <p className="text-sm text-muted-foreground">{description}</p>}
                  <dl className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <Row label="Weight" value={formatWeight(weightNum)} />
                    <Row label="Estimated value" value={formatCurrency(estimate)} />
                    <Row label="Pickup date" value={new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                    <Row label="Time slot" value={SLOTS.find((s) => s.value === slot)?.time ?? ''} />
                    <Row label="City" value={`${city} ${pincode}`} />
                    <Row label="Photos" value={`${images.length} uploaded`} />
                  </dl>
                  <p className="flex items-start gap-1.5 pt-1 text-[11px] text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {address}
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {[
                  'You can edit or cancel any time before pickup',
                  'Dealers cannot see your phone number until you accept an offer',
                  'Payout happens at pickup via UPI, Razorpay or cash',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {t}
                  </li>
                ))}
              </ul>
              {errors.form && <p className="text-sm font-medium text-destructive">{errors.form}</p>}
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-6 flex gap-2 border-t border-border pt-4">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={goBack} className="flex-1 sm:flex-none">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} className="flex-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} loading={loading} className="flex-1">
                {!loading && <CheckCircle2 className="h-4 w-4" />} Publish listing
              </Button>
            )}
          </div>
        </div>

        {/* Sticky summary rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live summary</p>
              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{category ? categoryName(category, lang) : '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{weightNum ? formatWeight(weightNum) : '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">{activeRate ? `₹${activeRate}/kg` : '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                  <span className="font-semibold">Estimate</span>
                  <span className="font-display text-lg font-bold text-primary">{formatCurrency(estimate)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-xs">
              <p className="font-semibold">Tips for a higher price</p>
              <ul className="mt-2 space-y-1.5 text-muted-foreground">
                <li>• Rinse bottles and remove caps</li>
                <li>• Flatten cartons and remove tape</li>
                <li>• Keep metals separated by type</li>
                <li>• Take photos in daylight</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
