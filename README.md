# Y. M. Devnikar — Udgir clothing store

A responsive, editorial-style storefront for **Y.M.DEVNIKAR / य.म.देवनीकर** on Hanuman Road, Udgir, Maharashtra.

## Run

This is a static website: HTML, CSS and vanilla JavaScript, with no production dependencies or build step.

```bash
python3 serve.py --host 0.0.0.0 --port 8000
```

Open the server in your browser. The local server only publishes the website assets; Git files, tooling, documentation and directory listings are blocked. Any static host, including Vercel, Netlify and GitHub Pages, can serve the repository root. For Vercel, import the repository and use the **Other** framework preset, with no build command or custom output directory.

## Features

- Responsive desktop/mobile navigation and a fashion-editorial hero
- Women's, men's, wedding and festive collection links
- Searchable, filterable style inspiration cards with quick-view dialogs
- A persistent, browser-local visit list: save/remove looks and copy or download the list
- English/Marathi language switching, remembered locally, with script-appropriate fonts, translated labels and bilingual search
- Shareable style-edit links: use the device’s native share sheet, copy a link, or download a list when browser permissions are unavailable
- Recipient previews with explicit “Save these looks” confirmation—shared links never silently overwrite or populate someone’s saved list
- Google review excerpts and the supplied 4.0 rating from 19 reviews
- Store address, closing-time information, delivery-service information and Google Maps directions
- Native keyboard-accessible dialogs, Escape handling, skip link, reduced-motion support and responsive layouts
- ClothingStore structured metadata, page description and a custom favicon
- Optimised, local WebP images and locally hosted fonts

## Business details and honesty

The business information comes from the Google Maps listing supplied for this project:

- **Address:** Hanuman Rd, Jijau Nagar, Khadkali, Udgir, Maharashtra 413517
- **Plus code:** 94W7+3R, Udgir
- **Rating:** 4.0 / 19 reviews
- **Services:** in-store shopping and delivery
- **Listed closing time:** 10:30 pm; an opening time or complete daily schedule was not supplied, so the site does not invent live open/closed status. Visitors are directed to Google Maps for current hours.
- **Phone, email and social profiles:** not supplied, so no fabricated contact links are included.

The fashion photographs are AI-generated editorial imagery, **not photographs of the shop or confirmed products**. The four looks are explicitly labelled as inspiration. No inventory, prices, discounts, fabric composition, sizes, reservations or payments are fabricated. Confirm actual availability, pricing and delivery terms in store.

The map is a labelled illustration, not a surveyed location. Its links open the store search or directions in Google Maps for the exact location.

## Language and sharing

- Choose **EN / मराठी** in the top bar, mobile menu or footer. The current edit and saved looks are retained when switching. The preference is stored locally, with `?lang=en` or `?lang=mr` taking precedence for shared/bookmarked links.
- Marathi copy includes headings, buttons, store information, FAQ, image descriptions, accessibility labels and the inspiration looks. Original customer quotations remain in English and are marked accordingly.
- Search accepts English and Marathi terms regardless of the chosen interface language.
- A saved list can be shared using the native device share sheet. Unsupported or denied sharing falls back to copying; denied clipboard access falls back to a text download.
- A link such as `?edit=sage-saree.ivory-kurta&lang=mr#styles` previews that edit. Only known look IDs are accepted; duplicates and unknown values are ignored. Recipients explicitly choose whether to save the shared looks to their existing list.
- Cancelling the native share sheet does not trigger copying or downloading. Shared links contain only look IDs and a language—not personal information, orders or reservations.
- Links use the current website origin. Share the production URL after deploying; preview links are for preview use.

## Browser checks

Development dependencies are only needed for tests; the website itself remains dependency-free.

```bash
npm install
npx playwright install chromium
npm test
```

The suite checks store information, collection filters, search, quick views, saved-list persistence/removal, keyboard focus, the clipboard download fallback, the mobile menu, responsive overflow, maps links, image loading, no-JavaScript access, bilingual rendering and search, language persistence, safe shared-link previews, native sharing/cancellation, copy/download fallbacks, asset-only serving, and automated WCAG AA accessibility checks. Automated checks are not a substitute for a complete manual accessibility audit.

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can point to an existing Chromium installation. `TEST_BASE_URL` optionally points the tests to a running server.

Fonts are redistributed under the SIL Open Font License; their license texts are included in `fonts/`.

## Editing

- Store copy, address, reviews, metadata and FAQ: `index.html`
- English look names, filters, tags and descriptions: the `looks` array in `js/script.js`
- Marathi static copy, translated looks, and dynamic bilingual messages: `js/i18n.js`; static translation hooks are `data-i18n*` attributes in `index.html`
- Initial no-build card markup: `#productGrid` in `index.html` (keep it consistent with the JavaScript data)
- Palette, typography, layout and breakpoints: `css/style.css`
- Editorial photos: `images/*.webp`
- Font files and licenses: `fonts/`
- Asset-only local serving: `serve.py` (production remains a static site)

Saved looks remain on the visitor's device using localStorage. No accounts, analytics, customer data collection or server-side orders are implemented. If storage is unavailable, saving still works for the current session and is labelled accordingly. If clipboard access is denied, the visit list downloads as a text file.

Before turning this into transactional e-commerce, add real product data and photography, verified prices and stock, seller contact details, delivery/payment integrations and appropriate business policies.
