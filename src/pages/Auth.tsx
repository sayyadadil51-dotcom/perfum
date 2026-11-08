import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/context/AppStore';
import { useToast } from '@/context/ToastContext';
import { cn, isValidPhone } from '@/lib/utils';
import { DEMO_PASSWORD } from '@/data/seed';
import type { Role } from '@/lib/types';
import { LANGUAGES } from '@/lib/i18n';

/* ── Shared shell ────────────────────────────────────────────────────────── */
function AuthShell({ children, side }: { children: React.ReactNode; side: React.ReactNode }) {
  return (
    <div className="container grid gap-10 py-8 lg:grid-cols-2 lg:items-center lg:py-14">
      <div className="mx-auto w-full max-w-md animate-fade-up">{children}</div>
      <div className="hidden lg:block">{side}</div>
    </div>
  );
}

function SidePanel() {
  return (
    <div className="relative overflow-hidden rounded-3xl gradient-leaf p-9 text-white">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-14 -left-10 h-52 w-52 rounded-full bg-white/5" />
      <Badge className="border-white/30 bg-white/15 text-white">
        <Sparkles className="h-3 w-3" /> Trusted by 2,000+ sellers
      </Badge>
      <h2 className="mt-4 font-display text-3xl font-bold leading-tight">
        Get the best price for every kilogram
      </h2>
      <p className="mt-3 text-sm text-white/80">
        Join sellers across Nagpur who get multiple offers from verified recyclers within hours —
        and paid on pickup.
      </p>
      <ul className="mt-6 space-y-3 text-sm">
        {[
          'Live per-kg rates for 10 scrap categories',
          'Verified dealers, rated by sellers',
          'Doorstep pickup at your preferred slot',
          'Instant UPI payout or cash on pickup',
        ].map((f) => (
          <li key={f} className="flex items-start gap-2 text-white/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-wide text-white/60">Did you know?</p>
        <p className="mt-1 text-sm">
          Recycling 1 kg of aluminium saves enough energy to run a TV for 3 hours.
        </p>
      </div>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────────────── */
function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Demo accounts card ──────────────────────────────────────────────────── */
function DemoAccounts() {
  const { loginAsDemo } = useAppStore();
  const toast = useToast();
  const navigate = useNavigate();

  const go = (role: Role) => {
    const user = loginAsDemo(role);
    if (!user) {
      toast.error('Demo account unavailable');
      return;
    }
    toast.success(`Signed in as ${user.name}`, `Demo ${role} account`);
    navigate(role === 'seller' ? '/seller' : role === 'buyer' ? '/buyer' : '/admin');
  };

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Try instantly</p>
      <p className="mt-1 text-xs text-muted-foreground">
        One-tap demo logins with pre-filled data. No OTP needed.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            { role: 'seller' as Role, label: 'Seller', icon: Home },
            { role: 'buyer' as Role, label: 'Dealer', icon: Store },
            { role: 'admin' as Role, label: 'Admin', icon: ShieldCheck },
          ] as const
        ).map((d) => (
          <button
            key={d.role}
            onClick={() => go(d.role)}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-2 py-2.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
          >
            <d.icon className="h-4 w-4" />
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Login ───────────────────────────────────────────────────────────────── */
export function LoginPage() {
  const { login, sendOtp, verifyOtp } = useAppStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = React.useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  // OTP state
  const [otpPhone, setOtpPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [demoOtp, setDemoOtp] = React.useState<string | null>(null);

  // Where to go after a successful login (?next=/buyer/orders/…)
  const rawNext = params.get('next');
  const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : null;

  React.useEffect(() => {
    if (params.get('role') === 'buyer') setMode('password');
  }, [params]);

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!identifier.trim()) next.identifier = 'Enter your phone number or email';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      const res = login(identifier, password);
      setLoading(false);
      if (!res.ok) {
        setErrors({ [identifier.includes('@') ? 'identifier' : 'identifier']: res.error });
        toast.error('Could not sign in', res.error);
        return;
      }
      toast.success(`Welcome back, ${res.data.name.split(' ')[0]}!`);
      navigate(nextPath ?? (res.data.role === 'seller' ? '/seller' : res.data.role === 'buyer' ? '/buyer' : '/admin'));
    }, 500);
  };

  const requestOtp = () => {
    const res = sendOtp(otpPhone);
    if (!res.ok) {
      setErrors({ otpPhone: res.error });
      return;
    }
    setErrors({});
    setDemoOtp(res.data.otp);
    toast.info('OTP sent', 'Demo mode — the code is shown below.');
  };

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const res = verifyOtp(otpPhone, otp);
    if (!res.ok) {
      setErrors({ otp: res.error });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = res.data;
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(nextPath ?? (user.role === 'seller' ? '/seller' : user.role === 'buyer' ? '/buyer' : '/admin'));
    }, 400);
  };

  return (
    <AuthShell side={<SidePanel />}>
      <div>
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="font-display text-3xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log in to manage your listings, offers and pickups.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(['password', 'otp'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'rounded-lg py-2 text-sm font-semibold transition',
                mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {m === 'password' ? 'Password' : 'Phone OTP'}
            </button>
          ))}
        </div>

        {mode === 'password' ? (
          <form onSubmit={submitPassword} className="mt-4 space-y-4" noValidate>
            <Field
              label="Phone number or email"
              htmlFor="identifier"
              error={errors.identifier}
              hint="Demo: 9876543210 (seller) · 9812345678 (dealer) · 9000000001 (admin)"
            >
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="identifier"
                  className="pl-9"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  aria-invalid={!!errors.identifier}
                  placeholder="98765 43210"
                />
              </div>
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  className="pl-9 pr-10"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {!loading && <KeyRound className="h-4 w-4" />} Log in
            </Button>
            <p className="rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
              Demo password for all accounts: <span className="font-mono font-semibold">{DEMO_PASSWORD}</span>
            </p>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="mt-4 space-y-4" noValidate>
            <Field label="Mobile number" htmlFor="otpPhone" error={errors.otpPhone} hint="We'll send a 6-digit code. Demo mode shows it on screen.">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">+91</span>
                <Input
                  id="otpPhone"
                  className="pl-12"
                  inputMode="numeric"
                  maxLength={10}
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  aria-invalid={!!errors.otpPhone}
                />
              </div>
            </Field>
            {demoOtp && (
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
                <span className="text-xs text-muted-foreground">Demo OTP</span>
                <span className="font-mono text-lg font-bold tracking-[0.3em] text-primary">{demoOtp}</span>
              </div>
            )}
            <Field label="One-time password" htmlFor="otp" error={errors.otp}>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="text-center font-mono text-lg tracking-[0.4em]"
                aria-invalid={!!errors.otp}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={requestOtp} className="flex-1">
                <Phone className="h-4 w-4" /> Send OTP
              </Button>
              <Button type="submit" className="flex-1" loading={loading} disabled={!demoOtp}>
                Verify & login
              </Button>
            </div>
          </form>
        )}

        <DemoAccounts />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to ScrapKart?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

/* ── Signup ──────────────────────────────────────────────────────────────── */
const INDIAN_STATES = [
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Gujarat',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Rajasthan',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
];

export function SignupPage() {
  const { signup } = useAppStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = React.useState(1);
  const [role, setRole] = React.useState<Role>((params.get('role') as Role) || 'seller');
  const [form, setForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'en' as 'en' | 'hi' | 'mr',
    businessName: '',
    gstin: '',
    serviceAreas: '',
    referralCode: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validateStep1 = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Enter your full name';
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) next.email = 'Enter a valid email';
    if (form.password.length < 6) next.password = 'Use at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next: Record<string, string> = {};
    if (!form.city.trim()) next.city = 'Enter your city';
    if (role === 'buyer' && !form.businessName.trim()) next.businessName = 'Business name is required for dealers';
    if (role === 'buyer' && form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin.toUpperCase()))
      next.gstin = 'That does not look like a valid 15-character GSTIN';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const res = signup({
        role,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        city: form.city,
        state: form.state,
        language: form.language,
        businessName: form.businessName || undefined,
        gstin: form.gstin || undefined,
        serviceAreas: form.serviceAreas
          ? form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        referralCode: form.referralCode || undefined,
      });
      setLoading(false);
      if (!res.ok) {
        toast.error('Could not create account', res.error);
        setErrors({ form: res.error });
        return;
      }
      toast.success('Account created 🎉', role === 'buyer' ? 'Your dealer account is pending admin approval.' : 'Let’s list your first scrap item.');
      navigate(role === 'buyer' ? '/buyer' : '/seller');
    }, 700);
  };

  return (
    <AuthShell side={<SidePanel />}>
      <div>
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="font-display text-3xl font-extrabold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Free forever for sellers. Takes under a minute.</p>

        {/* Progress */}
        <div className="mt-5 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition',
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {step > s ? '✓' : s}
              </span>
              {s < 3 && <span className={cn('h-0.5 flex-1 rounded', step > s ? 'bg-primary' : 'bg-border')} />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          {step === 1 && (
            <>
              <div>
                <Label>I want to</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'seller' as Role, title: 'Sell my scrap', desc: 'Household, shop or factory', icon: Home },
                      { value: 'buyer' as Role, title: 'Buy scrap', desc: 'Dealer or recycler', icon: Store },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setRole(o.value)}
                      aria-pressed={role === o.value}
                      className={cn(
                        'rounded-xl border-2 p-3 text-left transition',
                        role === o.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40',
                      )}
                    >
                      <o.icon className={cn('h-5 w-5', role === o.value ? 'text-primary' : 'text-muted-foreground')} />
                      <p className="mt-1.5 text-sm font-semibold">{o.title}</p>
                      <p className="text-[11px] text-muted-foreground">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Full name" htmlFor="name" error={errors.name}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" className="pl-9" value={form.name} onChange={set('name')} placeholder="Ananya Deshmukh" aria-invalid={!!errors.name} />
                </div>
              </Field>
              <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="Used for OTP login and pickup coordination">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">+91</span>
                  <Input
                    id="phone"
                    className="pl-12"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                    placeholder="98765 43210"
                    aria-invalid={!!errors.phone}
                  />
                </div>
              </Field>
              <Field label="Email (optional)" htmlFor="email" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9" value={form.email} onChange={set('email')} placeholder="you@example.com" aria-invalid={!!errors.email} />
                </div>
              </Field>
              <Field label="Password" htmlFor="pw" error={errors.password} hint="At least 6 characters">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="pw" type="password" className="pl-9" value={form.password} onChange={set('password')} placeholder="••••••••" aria-invalid={!!errors.password} />
                </div>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              {role === 'buyer' && (
                <>
                  <Field label="Business / shop name" htmlFor="biz" error={errors.businessName}>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="biz" className="pl-9" value={form.businessName} onChange={set('businessName')} placeholder="Verma Scrap & Recycling" aria-invalid={!!errors.businessName} />
                    </div>
                  </Field>
                  <Field label="GSTIN (optional)" htmlFor="gst" error={errors.gstin} hint="Required only for GST invoices">
                    <Input id="gst" value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))} placeholder="27AABCV1234M1Z5" aria-invalid={!!errors.gstin} maxLength={15} />
                  </Field>
                  <Field label="Service areas" htmlFor="areas" hint="Comma separated — e.g. Nagpur, Kamptee, Wadi">
                    <Input id="areas" value={form.serviceAreas} onChange={set('serviceAreas')} placeholder="Nagpur, Kamptee" />
                  </Field>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" htmlFor="city" error={errors.city}>
                  <Input id="city" value={form.city} onChange={set('city')} aria-invalid={!!errors.city} />
                </Field>
                <Field label="State" htmlFor="state">
                  <select
                    id="state"
                    value={form.state}
                    onChange={set('state')}
                    className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Preferred language">
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, language: l.code }))}
                      className={cn(
                        'rounded-xl border px-2 py-2 text-sm font-medium transition',
                        form.language === l.code ? 'border-primary bg-primary/5 text-primary' : 'border-border',
                      )}
                    >
                      {l.native}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
                <p className="font-semibold">Review your details</p>
                <dl className="mt-2 space-y-1.5 text-xs">
                  {[
                    ['Role', role === 'seller' ? 'Seller' : 'Dealer / recycler'],
                    ['Name', form.name],
                    ['Mobile', `+91 ${form.phone}`],
                    ['Email', form.email || '—'],
                    ['City', `${form.city}, ${form.state}`],
                    ...(role === 'buyer'
                      ? [
                          ['Business', form.businessName],
                          ['GSTIN', form.gstin || 'Not provided'],
                          ['Service areas', form.serviceAreas || form.city],
                        ]
                      : []),
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <Field label="Referral code (optional)" htmlFor="ref" hint="Get 50 welcome reward points">
                <Input id="ref" value={form.referralCode} onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))} placeholder="ANANYA25" />
              </Field>
              {role === 'buyer' && (
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  Dealer accounts need admin approval. You can browse listings meanwhile.
                </p>
              )}
              {errors.form && <p className="text-sm font-medium text-destructive">{errors.form}</p>}
            </>
          )}

          <div className="flex gap-2 pt-1">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={next} className="flex-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="flex-1" loading={loading}>
                {!loading && <Check className="h-4 w-4" />} Create account
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6">
          <DemoAccounts />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          By continuing you agree to our Terms of Service and Privacy Policy. We never share your
          phone number publicly.
        </p>
      </div>
    </AuthShell>
  );
}

export { Loader2 };
