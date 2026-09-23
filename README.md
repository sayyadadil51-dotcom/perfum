# Arjuna Celebrations Hall — Booking Website

A clean, modern, mobile-friendly booking website for **Arjuna Celebrations Hall**, a convention centre in Khamla, Nagpur.

- **Live info from the Google listing:** 4.3★ (3,553 reviews), address, phone (096899 02501), hours (open daily till 7:30 PM), plus code 4356+VX
- **Booking flow:** availability calendar + request form with WhatsApp/call confirmation
- **Sections:** hero, stats, overview & features, photo gallery (lightbox), packages, booking, visit us (map, popular times), reviews, FAQ
- **Tech:** pure HTML + CSS + JS — no build step, no dependencies

## Run locally

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on Vercel (free)

1. Make sure this code is on the `main` branch (merge the PR if needed).
2. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
3. Import the repo **sayyadadil51-dotcom/perfum**.
4. Leave everything default — it's a static site, so **no build command or output directory is needed**.
5. Click **Deploy**. Site goes live at `https://<project-name>.vercel.app`.
6. Optional: add a custom domain in **Settings → Domains**.

Every future push to `main` auto-deploys.

## Edit these placeholders

- Real photos → replace files in `images/`
- Capacity / parking numbers, package prices, reviews text → `index.html`
- Opening time (assumed 9:00 AM) → `#openStatus` element in `index.html`
- Booked dates in the calendar are a demo pattern → real availability needs a backend
