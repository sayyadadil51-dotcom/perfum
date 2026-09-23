# Rani Kothi Lawns — Booking Website

A clean, modern single-page website for **Rani Kothi Lawns (रानी कोठी लॉन्स)**, a wedding venue at 237, Temple Rd, Civil Lines, Nagpur.

## Features

- 🎨 Modern editorial design — Fraunces + Inter, warm ivory/gold palette
- 📱 Fully responsive (mobile nav, fluid grids)
- 📅 **Booking form** — event date with quick-pick chips, space (lawn / banquet / full package), guest count, event type
- 💾 Bookings saved to `localStorage` with pending/waitlist status + conflict detection
- ⭐ Real listing data — 4.3★ · 1,425 reviews, quotes from Google reviews, address, phone, hours, plus code
- 📊 Popular-times chart (Wednesday, "Live · Busier than usual")
- 🖼️ Photo gallery with AI-generated venue imagery
- 🗺️ Embedded Google Map with directions link
- ✨ Scroll-reveal animations, animated counters, marquee strip

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
