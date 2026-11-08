import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ImageUploader';
import { MapPicker } from '@/components/MapPicker';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { CATEGORIES, categoryName } from '@/data/categories';
import type { CategorySlug, Condition, TimeSlot } from '@/lib/types';
import { cn, formatCurrency, formatWeight } from '@/lib/utils';

/** Edit an existing listing (allowed while status is listed/accepted). */
export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, currentUser, lang, updateListing, rateFor } = useAppStore();
  const toast = useToast();

  const listing = state.listings.find((l) => l.id === id);
  const [form, setForm] = React.useState(() => ({
    category: (listing?.category ?? 'plastic') as CategorySlug,
    title: listing?.title ?? '',
    description: listing?.description ?? '',
    weightKg: String(listing?.weightKg ?? ''),
    condition: (listing?.condition ?? 'mixed') as Condition,
    images: listing?.images ?? [],
    address: listing?.pickup.address ?? '',
    city: listing?.pickup.city ?? '',
    pincode: listing?.pickup.pincode ?? '',
    lat: listing?.pickup.lat ?? 21.1458,
    lng: listing?.pickup.lng ?? 79.0882,
    preferredDate: listing?.preferredDate ?? '',
    preferredSlot: (listing?.preferredSlot ?? 'morning') as TimeSlot,
    askingPrice: listing?.askingPrice ? String(listing.askingPrice) : '',
  }));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  if (!listing || currentUser?.id !== listing.sellerId) {
    return (
      <EmptyState
        title="Listing not available"
        description="It may have been removed, or it belongs to another account."
        action={<Button asChild><Link to="/seller/listings">My listings</Link></Button>}
        className="mt-6"
      />
    );
  }
  if (!['listed', 'accepted'].includes(listing.status)) {
    return (
      <EmptyState
        title="This listing can no longer be edited"
        description="Pickups in progress or completed listings are locked to keep the order history accurate."
        action={<Button asChild><Link to={`/seller/listings/${listing.id}`}>View listing</Link></Button>}
        className="mt-6"
      />
    );
  }

  const rate = rateFor(form.category);
  const weight = Number(form.weightKg) || 0;
  const asking = Number(form.askingPrice) || 0;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.title.trim() || form.title.trim().length < 4) next.title = 'Add a short title';
    if (!(weight > 0)) next.weightKg = 'Enter the approximate weight';
    if (!form.images.length) next.images = 'Keep at least one photo';
    if (!form.address.trim()) next.address = 'Add the pickup address';
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = 'Enter a valid 6-digit pincode';
    if (!form.preferredDate) next.preferredDate = 'Choose a pickup date';
    if (form.askingPrice && !(asking > 0)) next.askingPrice = 'Asking price must be greater than 0';
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const res = updateListing(listing.id, {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        weightKg: weight,
        condition: form.condition,
        images: form.images,
        pickup: {
          lat: form.lat,
          lng: form.lng,
          address: form.address.trim(),
          city: form.city.trim(),
          pincode: form.pincode,
        },
        preferredDate: form.preferredDate,
        preferredSlot: form.preferredSlot,
        askingPrice: form.askingPrice ? asking : null,
      });
      setSaving(false);
      if (!res.ok) return toast.error('Could not save changes', res.error);
      toast.success('Listing updated');
      navigate(`/seller/listings/${listing.id}`);
    }, 600);
  };

  return (
    <div>
      <Link to={`/seller/listings/${listing.id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to listing
      </Link>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">Edit listing</h1>
          <p className="text-sm text-muted-foreground">Changes are visible to dealers immediately.</p>
        </div>
        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Est. {formatCurrency(weight * (asking || rate))}
        </span>
      </div>

      <form onSubmit={save} className="grid gap-4 lg:grid-cols-2" noValidate>
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: c.slug }))}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-1.5 text-[10px] font-medium transition',
                    form.category === c.slug ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground',
                  )}
                  title={categoryName(c.slug, lang)}
                >
                  <CategoryIcon slug={c.slug} size="sm" withTile={false} />
                  <span className="w-full truncate text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} aria-invalid={!!errors.title} maxLength={80} />
            {errors.title && <p className="text-xs font-medium text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={400} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" min={1} step="0.5" value={form.weightKg} onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))} aria-invalid={!!errors.weightKg} />
              {errors.weightKg && <p className="text-xs font-medium text-destructive">{errors.weightKg}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="condition">Condition</Label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as Condition }))}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="clean">Clean</option>
                <option value="mixed">Mixed</option>
                <option value="dirty">Dirty</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Photos</Label>
            <ImageUploader images={form.images} onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))} onError={(m) => toast.error('Photo issue', m)} />
            {errors.images && <p className="text-xs font-medium text-destructive">{errors.images}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="font-display text-sm font-semibold">Pickup details</h2>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} aria-invalid={!!errors.address} className="min-h-[70px]" />
              {errors.address && <p className="text-xs font-medium text-destructive">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pin">Pincode</Label>
                <Input id="pin" maxLength={6} inputMode="numeric" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} aria-invalid={!!errors.pincode} />
                {errors.pincode && <p className="text-xs font-medium text-destructive">{errors.pincode}</p>}
              </div>
            </div>
            <MapPicker
              value={{ lat: form.lat, lng: form.lng }}
              onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
              height={200}
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="font-display text-sm font-semibold">Slot & pricing</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date">Pickup date</Label>
                <Input id="date" type="date" value={form.preferredDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))} aria-invalid={!!errors.preferredDate} />
                {errors.preferredDate && <p className="text-xs font-medium text-destructive">{errors.preferredDate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slot">Slot</Label>
                <select
                  id="slot"
                  value={form.preferredSlot}
                  onChange={(e) => setForm((f) => ({ ...f, preferredSlot: e.target.value as TimeSlot }))}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
                >
                  <option value="morning">Morning (9–12)</option>
                  <option value="afternoon">Afternoon (12–4)</option>
                  <option value="evening">Evening (4–7)</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asking">Asking price per kg (₹) <span className="font-normal text-muted-foreground">— leave blank for market rate</span></Label>
              <Input id="asking" type="number" min={1} placeholder={String(rate)} value={form.askingPrice} onChange={(e) => setForm((f) => ({ ...f, askingPrice: e.target.value }))} aria-invalid={!!errors.askingPrice} />
              {errors.askingPrice ? (
                <p className="text-xs font-medium text-destructive">{errors.askingPrice}</p>
              ) : (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" /> Today's rate: ₹{rate}/kg · your estimate {formatCurrency(weight * (asking || rate))} for {formatWeight(weight)}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" asChild>
              <Link to={`/seller/listings/${listing.id}`}>Cancel</Link>
            </Button>
            <Button type="submit" className="flex-1" loading={saving}>
              {!saving && <CheckCircle2 className="h-4 w-4" />} Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
