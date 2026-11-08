# Arjuna Celebrations Hall — website + admin dashboard

A complete two-part build for **Arjuna Celebrations Hall**, a convention centre in Khamla, Nagpur,
implementing the *Website & Interactive Dashboard Master Blueprint* spec:

| Page | What it is |
|---|---|
| **`index.html`** | Public marketing website — hero, features, services, tour, gallery, pricing + comparison, booking, reviews, FAQ, footer |
| **`dashboard.html`** | Password-gated admin dashboard — KPIs, charts, data tables, invoices, reports, settings drawer |

Pure **HTML + CSS + JS**. No build step, no dependencies, no backend — all demo data is generated
in the browser.

## Run locally

```bash
python3 -m http.server 8000
# website   → http://localhost:8000
# dashboard → http://localhost:8000/dashboard.html
```

## Dashboard demo login

```
Email:    admin@arjunahall.in
Password: demo1234
```

Pick a role on the login screen to see the RBAC in action:

- **Super Admin** — every section, create/edit/delete
- **Manager** — bookings, invoices, customers, reports (no settings)
- **Staff** — overview, revenue and bookings, read-only

## What's implemented, by spec section

**§1 Logo & brand identity**
- `images/logo-full.svg` (header, 38px, clickable → home), `images/logo-full-light.svg` (footer / dark surfaces), `images/logo-mark.svg` (32–34px icon), `favicon.svg` (browser tab)
- Palette applied throughout: navy `#0f172a`, primary blue `#2563eb`, emerald `#10b981`, amber `#f59e0b`, slate `#f8fafc` — buttons, active links, chart series, status badges

**§2 Public frontend**
- Top nav: logo top-left, Home · Features · Services · Pricing · Gallery · Contact, global search with live results, `Login` (outlined) + `Book Now` (solid blue)
- Hero: headline, 2-line description, primary CTA, dashboard mock-up banner, rating + trust proofs
- Feature card grids with icons, 60-second venue tour (lightbox slideshow), free-vs-premium style comparison table, footer with company info, social icons and legal links

**§3–§4 Dashboard**
- 64px sticky top bar: hamburger, global search (⌘K), notification bell with unread badge, language, avatar dropdown
- 260px navy sidebar (collapses to a 72px icon rail): Overview · Sales & Revenue · Customers · Bookings · Invoices · Reports · Settings + system status
- 4 KPI cards (revenue, customers, bookings, pending) with trend arrows and sparklines
- 70/30 analytics row: multi-line growth chart (hover tooltips, date-range filter) + donut event mix
- Full-width data grid: search, status chips, column sorting, pagination, CSV export, colour-coded badges
- Quick actions + live activity feed; slide-over booking/customer/invoice drawer; profile, security (2FA), team roles, appearance and notification settings

**§5–§6**
- Responsive down to mobile (sidebar becomes a drawer, tables scroll), dark mode, empty states, print styles for reports, semantic landmarks + ARIA labels, and a skip link.

## Edit these placeholders

- **Photos** → replace files in `images/`
- **Capacity, parking, package prices, reviews** → `index.html`
- **Demo records** → `js/dashboard.js` (the `buildData()` function at the top)
- **Dashboard login** → hard-coded demo check in `js/dashboard.js` (`admin@arjunahall.in` / `demo1234`); swap for a real API + JWT before going live
- **Opening hours** → `#openStatus` (`data-open` / `data-close`) in `index.html`

> ⚠️ The dashboard is a front-end demo. Bookings, invoices and settings live in memory (theme/sidebar
> choice persist via `localStorage`). Connect a real backend before storing customer data.

## Deploy on Vercel (free)

1. Merge this branch into `main`.
2. Go to [vercel.com/new](https://vercel.com/new) and import **sayyadadil51-dotcom/perfum**.
3. Leave defaults — it is a static site, so no build command or output directory is needed.
4. Click **Deploy**. Website at `/`, dashboard at `/dashboard.html`.
