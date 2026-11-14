import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Globe,
  Leaf,
  LogOut,
  Moon,
  Save,
  Shield,
  Sparkles,
  Sun,
  User,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch, Avatar, AvatarFallback, Progress } from '@/components/ui/misc';
import { SectionCard } from '@/components/DashboardShell';
import { StatusBadge, Stars } from '@/components/StatusBadge';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { LANGUAGES } from '@/lib/i18n';
import { co2Saved } from '@/data/categories';
import { formatCurrency, formatDate, formatWeight, initials } from '@/lib/utils';

export default function Profile() {
  const { currentUser, state, updateProfile, logout, lang, setLang } = useAppStore();
  const { theme, set: setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = React.useState({
    name: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    city: currentUser?.city ?? '',
    state: currentUser?.state ?? '',
    businessName: currentUser?.businessName ?? '',
    gstin: currentUser?.gstin ?? '',
    serviceAreas: currentUser?.serviceAreas?.join(', ') ?? '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [notifPrefs, setNotifPrefs] = React.useState({ offers: true, pickup: true, chat: true, marketing: false });

  if (!currentUser) return null;

  const paid = state.orders.filter((o) => o.sellerId === currentUser.id && o.status === 'paid');
  const co2 = state.orders
    .filter((o) => ['picked_up', 'paid'].includes(o.status) && (o.sellerId === currentUser.id || o.buyerId === currentUser.id))
    .reduce((a, o) => a + co2Saved(o.finalWeightKg ?? o.declaredWeightKg, o.category), 0);
  const reviews = state.reviews.filter((r) => r.targetId === currentUser.id);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name cannot be empty';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) next.email = 'Enter a valid email';
    if (currentUser.role === 'buyer' && !form.businessName.trim()) next.businessName = 'Business name is required';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setTimeout(() => {
      const res = updateProfile({
        name: form.name.trim(),
        email: form.email.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        businessName: currentUser.role === 'buyer' ? form.businessName.trim() : null,
        gstin: form.gstin.trim() || null,
        serviceAreas: form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setSaving(false);
      if (!res.ok) return toast.error('Could not save', res.error);
      toast.success('Profile updated');
    }, 500);
  };

  const dash = currentUser.role === 'seller' ? '/seller' : currentUser.role === 'buyer' ? '/buyer' : '/admin';

  return (
    <div className="container max-w-3xl py-6 lg:py-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-16 w-16 ring-4 ring-primary/10">
          <AvatarFallback name={currentUser.name} className="text-lg" />
        </Avatar>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-extrabold">{currentUser.name}</h1>
          <p className="text-sm text-muted-foreground">
            {currentUser.businessName ?? (currentUser.role === 'seller' ? 'Individual seller' : 'Administrator')} ·{' '}
            {currentUser.city}, {currentUser.state}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="success" className="capitalize">{currentUser.role}</Badge>
            <StatusBadge status={currentUser.verificationStatus ?? 'none'} withDot={false} />
            {reviews.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Stars value={Math.round(currentUser.rating ?? 0)} size="sm" /> {currentUser.rating} ({reviews.length} reviews)
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to={dash}>Go to dashboard</Link>
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Wallet', value: formatCurrency(currentUser.walletBalance ?? 0), icon: Wallet },
          { label: 'Reward points', value: String(currentUser.rewardPoints ?? 0), icon: Sparkles },
          { label: 'CO₂ saved', value: `${co2.toFixed(1)} kg`, icon: Leaf },
          { label: 'Completed', value: String(currentUser.completedOrders ?? 0), icon: User },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/70 bg-card px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <s.icon className="h-3 w-3" /> {s.label}
            </p>
            <p className="mt-0.5 font-display text-base font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="profile" className="mt-5">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <form onSubmit={save}>
            <SectionCard title="Your details" description="Shown to the other party once a deal is confirmed">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} />
                  {errors.name && <p className="text-xs font-medium text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile number</Label>
                  <Input id="phone" value={`+91 ${currentUser.phone}`} disabled />
                  <p className="text-xs text-muted-foreground">Contact support to change your verified number</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} aria-invalid={!!errors.email} />
                  {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                {currentUser.role === 'buyer' && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="biz">Business name</Label>
                      <Input id="biz" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} aria-invalid={!!errors.businessName} />
                      {errors.businessName && <p className="text-xs font-medium text-destructive">{errors.businessName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gst">GSTIN</Label>
                      <Input id="gst" value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))} maxLength={15} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="areas">Service areas</Label>
                      <Textarea id="areas" className="min-h-[60px]" value={form.serviceAreas} onChange={(e) => setForm((f) => ({ ...f, serviceAreas: e.target.value }))} placeholder="Nagpur, Kamptee, Wadi" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Referral code</Label>
                  <Input value={currentUser.referralCode} readOnly className="font-mono" />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="submit" loading={saving}>
                  {!saving && <Save className="h-4 w-4" />} Save changes
                </Button>
              </div>
            </SectionCard>
          </form>

          <SectionCard title="Profile completeness" className="mt-4">
            <Progress value={(() => { let n = 0; if (currentUser.name) n += 25; if (currentUser.email) n += 25; if (currentUser.verificationStatus === 'approved') n += 25; if ((currentUser.completedOrders ?? 0) > 0) n += 25; return n; })()} />
            <p className="mt-2 text-xs text-muted-foreground">
              Complete profiles get up to 3× more offers. Add an email and complete your first pickup.
            </p>
          </SectionCard>
        </TabsContent>

        <TabsContent value="preferences">
          <SectionCard title="Appearance">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Dark mode</p>
                <p className="text-xs text-muted-foreground">Easier on the eyes at night</p>
              </div>
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-amber-500" />}
                <Switch checked={theme === 'dark'} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} aria-label="Toggle dark mode" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Language" description="Applies across all screens" className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); toast.success(`Language set to ${l.label}`); }}
                  className={
                    lang === l.code
                      ? 'rounded-xl border-2 border-primary bg-primary/5 p-3 text-left'
                      : 'rounded-xl border-2 border-border p-3 text-left hover:border-primary/40'
                  }
                >
                  <Globe className="h-4 w-4 text-primary" />
                  <p className="mt-1.5 text-sm font-semibold">{l.native}</p>
                  <p className="text-[11px] text-muted-foreground">{l.label}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Notifications" description="Choose what you want to hear about" className="mt-4">
            {[
              { key: 'offers' as const, label: 'New offers on my listings', desc: 'Instant push + in-app' },
              { key: 'pickup' as const, label: 'Pickup reminders', desc: '2 hours before the slot' },
              { key: 'chat' as const, label: 'Chat messages', desc: 'From dealers and sellers' },
              { key: 'marketing' as const, label: 'Tips & offers', desc: 'Rate alerts, referral bonuses' },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between border-b border-border/60 py-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch
                  checked={notifPrefs[n.key]}
                  onCheckedChange={(v) => {
                    setNotifPrefs((p) => ({ ...p, [n.key]: v }));
                    toast.info(`${n.label} ${v ? 'enabled' : 'disabled'}`);
                  }}
                  aria-label={n.label}
                />
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="security">
          <SectionCard title="Account security">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Mobile number verified</span>
                <Badge variant="success">+91 {currentUser.phone}</Badge>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Login alerts</span>
                <Badge variant="success">On</Badge>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Member since</span>
                <span className="text-xs text-muted-foreground">{formatDate(currentUser.createdAt)}</span>
              </li>
            </ul>
          </SectionCard>

          <SectionCard title="Session" className="mt-4">
            <p className="text-xs text-muted-foreground">
              You are signed in on this device. Logging out clears the demo session on this browser.
            </p>
            <Button
              variant="destructive"
              className="mt-3"
              onClick={() => {
                logout();
                toast.info('Signed out');
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </SectionCard>
        </TabsContent>

        <TabsContent value="reviews">
          <SectionCard title={`Reviews (${reviews.length})`} description="What others say about working with you">
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet. Complete a pickup to get your first one.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {reviews.map((r) => (
                  <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarFallback name={r.authorName} /></Avatar>
                        <div>
                          <p className="text-sm font-medium">{r.authorName}</p>
                          <p className="text-[11px] capitalize text-muted-foreground">{r.authorRole} · {formatDate(r.createdAt)}</p>
                        </div>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">"{r.comment}"</p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Signed in as {currentUser.name} ({currentUser.role}) · {initials(currentUser.name)} ·{' '}
        {paid.length} paid pickups · {formatWeight(co2)} CO₂ avoided
      </p>
    </div>
  );
}
