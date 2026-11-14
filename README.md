# ♻️ ScrapKart

**Turn your scrap into cash — from home.**
A full-stack, mobile-first marketplace where households, shops and factories sell scrap
(plastic, paper, cardboard, steel, iron, aluminium, copper, e-waste, glass) to **verified
dealers and recyclers** who pick it up from the doorstep and pay on the spot.

Built with **React + Vite + TypeScript + Tailwind CSS + shadcn/ui**, with **Supabase**
(Auth / Postgres / Storage / Realtime) and **Razorpay** wiring included, plus a complete
**demo backend** so every flow works end-to-end the moment you run it.

---

## ⚡ Quick start

```bash
npm install
npm run dev          # → http://localhost:5173
```

No keys, no database, no setup. The app ships with a seeded local backend
(`localStorage`) containing categories, live rates, listings, orders, reviews, chats
and three demo accounts.

### Demo accounts (one-tap buttons on the login page)

| Role | Phone | Password |
| --- | --- | --- |
| **Seller** — Ananya Deshmukh | `9876543210` | `scrap1234` |
| **Dealer** — Verma Scrap & Recycling | `9812345678` | `scrap1234` |
| **Admin** — ScrapKart Admin | `9000000001` | `scrap1234` |

Phone-OTP login also works: the demo OTP is displayed on screen.

---

## ✨ What's inside

### Seller
- **3-step "Sell Scrap" wizard** (6 guided screens): category → weight/condition → up to 5
  photos with client-side compression → **Leaflet map pin** + address → pickup date/slot →
  live-rate estimate **or your own asking price** → review & publish.
- Dashboard with earnings trend, category mix donut, pending offers, upcoming pickups,
  environmental impact and rating.
- Manage listings (edit / cancel before pickup), compare & **counter/accept offers**.
- Orders: schedule or reschedule pickup, track status
  **Listed → Accepted → Pickup Scheduled → Picked Up → Paid**, download receipts,
  confirm payment, rate the dealer, raise disputes.
- Earnings + payout history, rewards & referral programme, in-app chat.

### Buyer (dealer / recycler)
- Registration with business name, **GSTIN (optional)**, service areas → **admin approval gate**.
- Browse with filters for **category, distance, weight, price** + sorting; skeleton loading.
- Listing detail with offers, counter-offers from sellers, chat, accept-at-asking.
- Orders: mark collected with **final weighed quantity**, pay via **UPI / Razorpay / cash**.
- Wallet with spending trend, outstanding dues and CSV statement.

### Admin
- Analytics: scrap collected (kg), commission revenue, active users, CO₂ avoided,
  daily-collections area chart, category pie, GMV line, signup bars.
- **Buyer approvals** (approve/reject with reason), **daily rate editor** + bulk % adjust,
  category enable/disable, all users (suspend/reactivate/export), all listings,
  disputes & support tickets, full JSON export, one-click demo reset.

### Cross-cutting
- 🔐 **Role-based route guards** — sellers, dealers and admins only see their own area.
- 🌗 **Dark mode** (system-aware, persisted).
- 🌐 **i18n: English / हिन्दी / मराठी** (UI strings + category names).
- 🔔 Notifications bell with unread counts; realtime-style in-app chat.
- 🌱 **Environmental impact counter** — CO₂ saved per category, shown per listing/order/dashboard.
- 📱 Mobile-first: bottom tab bar, sheets, 44px tap targets, sticky summary rails.
- ✅ Inline form validation with friendly error messages, toasts, loading & empty states.

---

## 🧱 Architecture

```
src/
├─ components/          # UI kit (shadcn-style) + domain components
│  ├─ ui/               # button, input, dialog, sheet, tabs, select, badge…
│  ├─ Layout.tsx        # navbar, mobile nav, language & theme switchers
│  ├─ ListingCard.tsx   # listing tile + skeleton
│  ├─ MapPicker.tsx     # Leaflet pin picker + read-only map
│  ├─ ImageUploader.tsx # 5-photo uploader with canvas compression
│  ├─ ChatPanel.tsx     # seller ⇄ dealer thread + thread list
│  └─ RouteGuards.tsx   # auth/role guards, 404
├─ context/
│  ├─ AppStore.tsx      # ⭐ the whole "backend": typed mutations, validation,
│  │                    #    notifications, persistence to localStorage
│  ├─ ThemeContext.tsx
│  └─ ToastContext.tsx
├─ data/
│  ├─ categories.ts     # 10 categories, icons, CO₂ factors
│  └─ seed.ts           # demo users, listings, orders, offers, reviews, chats
├─ lib/
│  ├─ types.ts          # domain types — mirrors supabase/schema.sql 1:1
│  ├─ supabase.ts       # optional client (activates when env vars exist)
│  ├─ i18n.ts           # en / hi / mr dictionaries
│  └─ utils.ts          # ₹ formatting, weights, distance, dates
└─ pages/               # public pages + seller/ buyer/ admin/ dashboards
supabase/
├─ schema.sql           # 12 tables, enums, triggers, RLS policies, views, buckets
└─ seed.sql             # categories, rates, demo accounts, sample listings
```

Every mutation in `AppStore.tsx` returns `{ ok, data } | { ok: false, error }`, so UI
validation and server-side validation share one code path. To go live on Supabase, replace
the bodies with `supabase.from(...)` calls — the shapes already match the SQL schema.

---

## 🗄️ Database (Supabase)

Tables: `profiles`, `categories`, `scrap_rates`, `listings`, `listing_images`, `offers`,
`orders`, `payments`, `reviews`, `messages`, `notifications`, `disputes` (+ `support_tickets`).

**Security:** Row Level Security is enabled on every table —
users can only read/update their own profile, listings, offers, orders, payments,
messages and notifications; dealers can read only `listed` listings; admin policies use a
`is_admin()` helper; public views (`public_profiles`, `current_rates`) never leak phone
numbers. Triggers keep wallet balances, reward points, `estimated_price`, order amounts and
notifications consistent, and `messages`/`offers`/`orders`/`notifications` are added to the
Realtime publication.

Enable it:

```bash
# 1. Create a project at supabase.com
# 2. SQL editor → paste supabase/schema.sql → Run
# 3. SQL editor → paste supabase/seed.sql  → Run
cp .env.example .env.local
# 4. Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

The app detects the keys automatically (`src/lib/supabase.ts`); with no keys it quietly uses
the demo backend.

## 💳 Payments

- Demo mode simulates the Razorpay/UPI confirmation (1.2 s) and records a payment row.
- To go live: set `VITE_RAZORPAY_KEY_ID`, add a server endpoint that creates a Razorpay order
  (secret key must stay server-side), and swap the `payOrder` body for the checkout callback.
- Cash-on-pickup is a first-class option for both roles.

## 🗺️ Maps

Leaflet + OpenStreetMap — no API key needed. "Use my location" uses the browser geolocation
API; the exact pin is only revealed to the dealer whose offer is accepted.

---

## 🚀 Deploy

**Vercel — one click**

1. <https://vercel.com/new> → *Import Git Repository* → `sayyadadil51-dotcom/perfum`.
2. Leave every setting on auto-detect. `vercel.json` already pins the Vite framework, the
   `npm run build` command, `dist` output, the SPA rewrite (`/(.*) → /index.html`), immutable
   caching for `/assets/*` and the security headers. Root directory stays `.` (the app lives at
   the repo root; `legacy/` is ignored by the build).
3. Press **Deploy**. No environment variables are required — with none set the app runs on its
   built-in localStorage demo backend, so the deployed URL is fully clickable straight away
   (demo logins are on the sign-in page).
4. *Optional, for the real backend:* create a Supabase project, run `supabase/schema.sql` then
   `supabase/seed.sql` in the SQL editor, copy the project URL + anon key into
   *Settings → Environment Variables* as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and
   redeploy. Add `VITE_RAZORPAY_KEY_ID` only when wiring live payments.

Because the project is a Vite SPA, a plain deploy must keep the catch-all rewrite to
`index.html`; without it, deep links such as `/buyer/orders/o_5001` return 404 on refresh.

```bash
npm i -g vercel && vercel --prod   # CLI alternative, from the repo root
```

**Netlify** — `netlify.toml` provides the build command, publish dir and SPA redirect.

**Any static host** — `npm run build` → upload `dist/` with a catch-all rewrite to
`index.html` (client-side routing).

```bash
npm run build      # type-check + production bundle
npm run preview    # serve the production build locally
npm run typecheck
```

---

## 🎨 Design system

Eco-green + warm paper + earthy clay on a near-white canvas; `Outfit` for headings,
`Plus Jakarta Sans` for body. Tokens live in `src/index.css` (HSL variables, light + dark) and
`tailwind.config.ts` (leaf/forest/clay ramps, soft shadows, motion). Every category has its own
icon and tint; animations respect `prefers-reduced-motion`.

## 📁 Legacy site

The repository previously hosted a static wedding-hall website. It is preserved unchanged in
[`legacy/`](legacy/) for reference.

---

© ScrapKart Technologies Pvt. Ltd. — demo project. Rates, dealers and reviews are illustrative.
