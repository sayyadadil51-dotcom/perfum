# Rani Kothi Lawns — Booking Website

A clean, modern single-page website for **Rani Kothi Lawns (रानी कोठी लॉन्स)**, a wedding venue at 237, Temple Rd, Civil Lines, Nagpur.

## Features

- 🎨 Modern editorial design — Fraunces + Inter, warm ivory/gold palette
- 📣 **Seasonal offer banner** — fixed top bar with tag/message/CTA, dismissible (remembered), nav shifts down while visible
- 🎠 **Testimonials carousel** — 3/2/1 cards per view, arrows + dots, auto-advance (pauses on hover), touch swipe; hidden grid kept for SEO
- 🚀 **GitHub Pages deploy workflow** — `.github/workflows/deploy.yml` publishes on push (enable Pages → Source: GitHub Actions in repo settings)
- 🌓 **Dark mode** — toggle in nav (◐/☾), respects system preference, no flash on load, saved
- 🕌 **Wedding journey timeline** — Mehendi → Sangeet → Haldi → Pheras → Reception
- 📲 **WhatsApp booking handoff** — success screen offers "Send on WhatsApp" pre-filled with the full booking summary
- 🌐 **EN / हिंदी language toggle** — full Hindi translation of nav, hero, sections, packages, events, gallery filters, FAQ, booking & admin (preference saved)
- 📦 **Packages section** — Essential / Signature / Grand tiers with inclusions & quote CTAs (no invented prices)
- ❓ **FAQ accordion** — 6 common venue questions, one-open-at-a-time
- 💬 **WhatsApp button** — pre-filled message to 098231 70071
- 📱 Fully responsive (mobile nav, fluid grids)
- 📅 **Booking form** — event date with quick-pick chips, space (lawn / banquet / full package), guest count, event type
- 💾 Bookings saved to `localStorage` with pending/waitlist status + conflict detection
- 🔍 SEO — Open Graph meta, SVG favicon, JSON-LD `WeddingVenue` schema
- ⭐ Real listing data — 4.3★ · 1,425 reviews, quotes from Google reviews, address, phone, hours, plus code
- 📊 Popular-times chart (Wednesday, "Live · Busier than usual")
- 🖨️ **Printable booking slip** — print button on success screen + admin rows; print CSS shows only a formal slip (venue header, details table, ref no., signatures)
- 📈 **Scroll progress bar** + floating **back-to-top** button
- 🍽️ **Catering menu section** — tabbed Pure Veg / Non-Veg / Sweets & Drinks with bilingual dish names, note on custom menus
- 🔍 **SEO files** — `robots.txt`, `sitemap.xml` (all section anchors), canonical + robots meta, **FAQPage + Menu JSON-LD** structured data
- 🖼️ Photo gallery with **category filters** (Garden / Hall / Ceremony / Decoration / Catering / Street View) + lightbox (keyboard nav) + AI-generated venue imagery
- 🛠️ **Staff dashboard** (`#admin`, footer → Staff) — KPI stats, searchable table, click-to-cycle status (Pending→Confirmed→Declined), call/delete row actions, **CSV export**, clear all
- 🗺️ Embedded Google Map with directions link
- ✨ Scroll-reveal animations, animated counters, marquee strip, floating call/WhatsApp/Book CTAs

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy (GitHub Pages)

One-time manual setup (repo owner):

1. Open the repo on GitHub → **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Save — the `Deploy to GitHub Pages` workflow runs on every push

Site URL: `https://sayyadadil51-dotcom.github.io/perfum/`

> Never commit tokens or secrets to this repository. Deployment uses the built-in `GITHUB_TOKEN` only.

## Structure

```
index.html    — all sections (hero, about, spaces, gallery, reviews, booking, visit)
styles.css    — design system + responsive styles
script.js     — nav, animations, booking logic (localStorage)
images/       — venue photography
```
