# Rani Kothi Lawns — Booking Website

A clean, modern single-page website for **Rani Kothi Lawns (रानी कोठी लॉन्स)**, a wedding venue at 237, Temple Rd, Civil Lines, Nagpur.

## Features

- 🎨 Modern editorial design — Fraunces + Inter, warm ivory/gold palette
- 🌐 **EN / हिंदी language toggle** — full Hindi translation of nav, hero, sections, packages, FAQ & booking (preference saved)
- 📦 **Packages section** — Essential / Signature / Grand tiers with inclusions & quote CTAs (no invented prices)
- ❓ **FAQ accordion** — 6 common venue questions, one-open-at-a-time
- 💬 **WhatsApp button** — pre-filled message to 098231 70071
- 📱 Fully responsive (mobile nav, fluid grids)
- 📅 **Booking form** — event date with quick-pick chips, space (lawn / banquet / full package), guest count, event type
- 💾 Bookings saved to `localStorage` with pending/waitlist status + conflict detection
- 🔍 SEO — Open Graph meta, SVG favicon, JSON-LD `WeddingVenue` schema
- ⭐ Real listing data — 4.3★ · 1,425 reviews, quotes from Google reviews, address, phone, hours, plus code
- 📊 Popular-times chart (Wednesday, "Live · Busier than usual")
- 🖼️ Photo gallery with lightbox (keyboard nav) + AI-generated venue imagery
- 🗺️ Embedded Google Map with directions link
- ✨ Scroll-reveal animations, animated counters, marquee strip, floating call/WhatsApp/Book CTAs

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Structure

```
index.html    — all sections (hero, about, spaces, gallery, reviews, booking, visit)
styles.css    — design system + responsive styles
script.js     — nav, animations, booking logic (localStorage)
images/       — venue photography
```
