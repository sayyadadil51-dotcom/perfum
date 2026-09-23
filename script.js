/* ============================================
   Rani Kothi Lawns — Interactions & Booking
   ============================================ */
(function () {
  "use strict";

  // ---------- Nav ----------
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("open");
    navLinks.classList.toggle("open");
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navToggle.classList.remove("open");
      navLinks.classList.remove("open");
    })
  );

  // ---------- Theme (light / dark) ----------
  const themeToggle = document.getElementById("themeToggle");
  const storedTheme =
    localStorage.getItem("raniKothiTheme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.textContent = theme === "dark" ? "☾" : "◐";
    themeToggle.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    localStorage.setItem("raniKothiTheme", theme);
  }
  applyTheme(storedTheme);
  themeToggle.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
  });

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll(".reveal");
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          revealIO.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => revealIO.observe(el));

  // ---------- Animated counters ----------
  const counters = document.querySelectorAll("[data-count]");
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 1400;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString("en-IN");
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        countIO.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => countIO.observe(el));

  // ---------- Footer year ----------
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- Booking space shortcuts ----------
  document.querySelectorAll("[data-space]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const spaceSel = document.getElementById("space");
      const val = btn.dataset.space;
      [...spaceSel.options].forEach((o) => {
        if (o.value === val || o.text === val) spaceSel.value = o.value || o.text;
      });
    });
  });

  // ---------- Quick date chips ----------
  const dateInput = document.getElementById("eventDate");
  const chipsWrap = document.getElementById("dateChips");
  const fmt = (d) => d.toISOString().split("T")[0];
  const today = new Date();

  // min date = tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = fmt(tomorrow);

  const quickDates = [
    { label: "This weekend", days: daysToWeekend(today) },
    { label: "+2 weeks", days: 14 },
    { label: "+1 month", days: 30 },
    { label: "+3 months", days: 90 },
  ];

  function daysToWeekend(d) {
    const day = d.getDay(); // 0 Sun ... 6 Sat
    const toSat = (6 - day + 7) % 7 || 7;
    return toSat;
  }

  quickDates.forEach((q) => {
    const d = new Date(today);
    d.setDate(d.getDate() + q.days);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "date-chip";
    chip.textContent = `${q.label} · ${d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    })}`;
    chip.dataset.date = fmt(d);
    chip.addEventListener("click", () => {
      chipsWrap.querySelectorAll(".date-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      dateInput.value = chip.dataset.date;
      dateInput.classList.remove("error");
    });
    chipsWrap.appendChild(chip);
  });

  dateInput.addEventListener("change", () => {
    chipsWrap.querySelectorAll(".date-chip").forEach((c) => {
      c.classList.toggle("active", c.dataset.date === dateInput.value);
    });
  });

  // ---------- Bookings storage ----------
  const STORAGE_KEY = "raniKothiBookings";

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveBookings(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function renderBookings() {
    const wrap = document.getElementById("myBookings");
    const list = document.getElementById("bookingsList");
    const bookings = getBookings();
    if (!bookings.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    list.innerHTML = "";
    bookings
      .slice()
      .reverse()
      .forEach((b) => {
        const item = document.createElement("div");
        item.className = "booking-item";
        const dateObj = new Date(b.date + "T00:00:00");
        const dateStr = dateObj.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        item.innerHTML = `
          <div>
            <strong>${escapeHtml(b.space)}</strong> · ${escapeHtml(b.eventType)}
            <div class="booking-item__meta">${dateStr} · ${escapeHtml(b.guests)} guests · ${escapeHtml(b.name)} (${escapeHtml(b.phone)})</div>
          </div>
          <span class="booking-item__status">${escapeHtml(b.status)}</span>
          <button class="booking-item__remove" title="Remove" aria-label="Remove booking">✕</button>
        `;
        item.querySelector(".booking-item__remove").addEventListener("click", () => {
          saveBookings(getBookings().filter((x) => x.id !== b.id));
          renderBookings();
        });
        list.appendChild(item);
      });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- Booking form ----------
  const form = document.getElementById("bookingForm");
  const successBox = document.getElementById("formSuccess");
  const successText = document.getElementById("successText");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const date = form.eventDate.value;

    let valid = true;
    const setError = (el, on) => el.classList.toggle("error", on);

    if (name.length < 2) { setError(form.name, true); valid = false; }
    else setError(form.name, false);

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) { setError(form.phone, true); valid = false; }
    else setError(form.phone, false);

    if (!date || date < dateInput.min) { setError(form.eventDate, true); valid = false; }
    else setError(form.eventDate, false);

    if (!valid) {
      form.querySelector(".error")?.focus();
      return;
    }

    const booking = {
      id: Date.now(),
      name,
      phone,
      date,
      eventType: form.eventType.value,
      space: form.space.value,
      guests: form.guests.value,
      message: form.message.value.trim(),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    lastBooking = booking;

    const bookings = getBookings();
    // Soft conflict check: same date already requested
    const conflict = bookings.find((b) => b.date === date);
    if (conflict) {
      booking.status = "Waitlist";
    }
    bookings.push(booking);
    saveBookings(bookings);
    renderBookings();

    const dateObj = new Date(date + "T00:00:00");
    const nice = dateObj.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    successText.textContent =
      booking.status === "Waitlist"
        ? `We already have a request for ${nice} — you've been added to the waitlist. Our team will call you at ${phone}.`
        : `Thank you, ${name.split(" ")[0]}! Your request for ${booking.space} on ${nice} is in. Our team will call you at ${phone} shortly.`;

    // Pre-fill WhatsApp confirmation with the booking summary
    const waMsg =
      `Namaste Rani Kothi Lawns! 🌸%0A` +
      `Booking request:%0A` +
      `• Name: ${encodeURIComponent(name)}%0A` +
      `• Phone: ${encodeURIComponent(phone)}%0A` +
      `• Date: ${encodeURIComponent(nice)}%0A` +
      `• Event: ${encodeURIComponent(booking.eventType)}%0A` +
      `• Space: ${encodeURIComponent(booking.space)}%0A` +
      `• Guests: ${encodeURIComponent(booking.guests)}` +
      (booking.message ? `%0A• Notes: ${encodeURIComponent(booking.message)}` : "");
    document.getElementById("waConfirm").href =
      `https://wa.me/919823170071?text=${waMsg}`;

    successBox.hidden = false;
  });

  document.getElementById("bookAnother").addEventListener("click", () => {
    successBox.hidden = true;
    form.reset();
    chipsWrap.querySelectorAll(".date-chip").forEach((c) => c.classList.remove("active"));
    form.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  });

  renderBookings();

  // ---------- i18n (EN / हिंदी) ----------
  const I18N = {
    en: {
      "nav.about": "About",
      "nav.spaces": "Spaces",
      "nav.packages": "Packages",
      "nav.events": "Events",
      "nav.gallery": "Gallery",
      "nav.reviews": "Reviews",
      "nav.faq": "FAQ",
      "nav.visit": "Visit",
      "nav.book": "Book Now",
      "nav.bookShort": "Book",
      "events.eyebrow": "Your Wedding Journey",
      "events.t1": "Every ritual,",
      "events.t2": "one",
      "events.t3": "beautiful venue",
      "events.sub": "From mehendi afternoons to the reception finale — host every function at Rani Kothi without changing addresses.",
      "ev1.n": "Mehendi",
      "ev1.d": "An afternoon of henna, music and laughter on the green lawn.",
      "ev2.n": "Sangeet",
      "ev2.d": "Dance night in the banquet hall with stage, lights and AV.",
      "ev3.n": "Haldi",
      "ev3.d": "A bright morning ritual surrounded by marigolds in the garden.",
      "ev4.n": "Wedding Pheras",
      "ev4.d": "The main ceremony under the mandap, with your guests around you.",
      "ev5.n": "Reception",
      "ev5.d": "A grand finale dinner — stage, décor and full catering service.",
      "book.okTitle": "Request received!",
      "book.wa": "Send on WhatsApp ↗",
      "book.print": "Print slip",
      "book.another": "Book another date",
      "nav.staff": "Staff",
      "gal.all": "All",
      "gal.garden": "Garden",
      "gal.hall": "Banquet Hall",
      "gal.ceremony": "Ceremony",
      "gal.decoration": "Decoration",
      "gal.catering": "Catering",
      "gal.exterior": "Street View",
      "admin.eyebrow": "Staff Only",
      "admin.t1": "Bookings",
      "admin.t2": "dashboard",
      "admin.search": "Search name, phone, date…",
      "admin.export": "Export CSV",
      "admin.clear": "Clear all",
      "admin.total": "Total",
      "admin.pending": "Pending",
      "admin.confirmed": "Confirmed",
      "admin.waitlist": "Waitlist",
      "admin.thDate": "Date",
      "admin.thGuest": "Guest",
      "admin.thPhone": "Phone",
      "admin.thEvent": "Event",
      "admin.thSpace": "Space",
      "admin.thGuests": "Pax",
      "admin.thStatus": "Status",
      "admin.thActions": "Actions",
      "admin.empty": "No booking requests yet — submit the form above to see them here.",
      "admin.note": "Stored locally in this browser (demo mode). Status: click Pending → Confirmed → Declined → Pending.",
      "hero.eyebrow": "Wedding Venue · Civil Lines, Nagpur",
      "hero.t1": "Where Your",
      "hero.t2": "Big Day",
      "hero.t3": "Blooms",
      "hero.sub": "A beautifully maintained garden lawn & banquet hall in the heart of Civil Lines — perfect for weddings, receptions and celebrations up to 800 guests.",
      "hero.cta": "Check Availability",
      "about.eyebrow": "About the Venue",
      "about.t1": "A landmark for",
      "about.t2": "celebrations",
      "about.t3": "in Nagpur",
      "about.lead": "For years, families across Nagpur have trusted Rani Kothi Lawns for their most important moments — weddings, receptions, sangeet and kirtans. Guests consistently praise our <strong>well-maintained facilities, courteous staff and delicious food</strong>.",
      "spaces.eyebrow": "Our Spaces",
      "spaces.t1": "Two spaces,",
      "spaces.t2": "endless",
      "spaces.t3": "possibilities",
      "spaces.sub": "Book the lawn, the banquet hall — or both together for a grand celebration.",
      "pkg.eyebrow": "Celebration Packages",
      "pkg.sub": "Every function is different — pick a starting point and we’ll customise the quote for your date, guest count and menu.",
      "pkg.tier1": "Essential",
      "pkg.tier2": "Signature",
      "pkg.tier3": "Grand",
      "pkg.popular": "Most Booked",
      "pkg.quote": "Custom quote",
      "pkg.cta": "Get a Quote",
      "pkg.note": "Indicative planning tiers — final pricing depends on date, season, menu and guest count. Call <a href=\"tel:09823170071\">098231 70071</a> for this week’s rates.",
      "pkg1.a": "Lawn rental for your chosen slot",
      "pkg1.b": "Basic mandap & stage setup",
      "pkg1.c": "Chairs & tables for guests",
      "pkg1.d": "Parking + venue manager",
      "pkg1.e": "Catering add-on available",
      "pkg2.a": "Everything in Essential",
      "pkg2.b": "Full vegetarian/non-veg menu",
      "pkg2.c": "Welcome drinks & dessert counter",
      "pkg2.d": "Service staff for the function",
      "pkg2.e": "Menu tasting before the event",
      "pkg3.a": "Lawn + banquet hall combined",
      "pkg3.b": "Premium decoration & lighting",
      "pkg3.c": "Catering for all functions",
      "pkg3.d": "Dedicated wedding coordinator",
      "pkg3.e": "Sangeet / reception AV setup",
      "reviews.eyebrow": "Guest Love",
      "reviews.t1": "What Nagpur",
      "reviews.t2": "says",
      "reviews.t3": "about us",
      "faq.eyebrow": "Good to Know",
      "faq1.q": "How many guests can Rani Kothi Lawns accommodate?",
      "faq1.a": "The garden lawn comfortably hosts up to 800 guests, and the banquet hall up to 400. Booking both spaces together works beautifully for multi-function weddings.",
      "faq2.q": "Do you provide catering and decoration?",
      "faq2.a": "Yes — in-house catering with menu tasting, plus full decoration (mandap, stage, floral décor and lighting). Guests rate the food as “really worth tasting”.",
      "faq3.q": "Is there parking at the venue?",
      "faq3.a": "Yes, ample parking space is available on-site — one of the most praised facilities in our reviews.",
      "faq4.q": "How do I check if my date is free?",
      "faq4.a": "Submit the booking form below or call 098231 70071 — we’ll confirm availability the same day. Checking availability is free with no charges.",
      "faq5.q": "Can I visit the venue before booking?",
      "faq5.a": "Absolutely. Walk in any day until 9 pm, or book a slot through the form so our team can show you around the lawn and hall personally.",
      "faq6.q": "Where exactly is the venue located?",
      "faq6.a": "237, Temple Rd, Civil Lines, Nagpur, Maharashtra 440001 (Plus Code 5328+8Q) — right in the heart of Civil Lines with easy access across the city.",
      "book.eyebrow": "Reserve Your Date",
      "book.t1": "Let’s plan your",
      "book.t2": "celebration",
      "book.lead": "Share a few details and our team will call you back within a few hours to confirm availability, pricing and a personal tour of the venue.",
      "book.submit": "Request Booking ↗",
      "visit.eyebrow": "Visit Us",
      "visit.t1": "Find",
      "visit.t2": "Rani Kothi",
    },
    hi: {
      "nav.about": "परिचय",
      "nav.spaces": "जगहें",
      "nav.packages": "पैकेज",
      "nav.events": "फंक्शन",
      "nav.gallery": "फ़ोटो",
      "nav.reviews": "रिव्यू",
      "nav.faq": "सवाल-जवाब",
      "nav.visit": "पता",
      "nav.book": "बुक करें",
      "nav.bookShort": "बुक",
      "events.eyebrow": "आपकी शादी की यात्रा",
      "events.t1": "हर रस्म,",
      "events.t2": "एक",
      "events.t3": "सुंदर जगह",
      "events.sub": "मेहंदी की दोपहर से रिसेप्शन तक — हर फंक्शन रानी कोठी में, बिना जगह बदले।",
      "ev1.n": "मेहंदी",
      "ev1.d": "हरे लॉन पर मेहंदी, संगीत और ठहाकों की दोपहर।",
      "ev2.n": "संगीत",
      "ev2.d": "बैंक्वेट हॉल में स्टेज, लाइट और AV के साथ डांस नाइट।",
      "ev3.n": "हल्दी",
      "ev3.d": "बाग़ में गेंदों के बीच चमकती सुबह की रस्म।",
      "ev4.n": "फेरे",
      "ev4.d": "मंडप के नीचे मुख्य संस्कार, आपके मेहमानों के बीच।",
      "ev5.n": "रिसेप्शन",
      "ev5.d": "भव्य फ़ाइनल डिनर — स्टेज, डेकोर और पूरी कैटरिंग।",
      "book.okTitle": "रिक्वेस्ट मिल गई!",
      "book.wa": "WhatsApp पर भेजें ↗",
      "book.print": "स्लिप प्रिंट करें",
      "book.another": "एक और तारीख़ बुक करें",
      "nav.staff": "स्टाफ़",
      "gal.all": "सभी",
      "gal.garden": "गार्डन",
      "gal.hall": "बैंक्वेट हॉल",
      "gal.ceremony": "सेरेमनी",
      "gal.decoration": "सजावट",
      "gal.catering": "कैटरिंग",
      "gal.exterior": "स्ट्रीट व्यू",
      "admin.eyebrow": "सिर्फ़ स्टाफ़",
      "admin.t1": "बुकिंग",
      "admin.t2": "डैशबोर्ड",
      "admin.search": "नाम, फ़ोन, तारीख़ खोजें…",
      "admin.export": "CSV एक्सपोर्ट",
      "admin.clear": "सभी हटाएँ",
      "admin.total": "कुल",
      "admin.pending": "पेंडिंग",
      "admin.confirmed": "कन्फ़र्म",
      "admin.waitlist": "वेटलिस्ट",
      "admin.thDate": "तारीख़",
      "admin.thGuest": "मेहमान",
      "admin.thPhone": "फ़ोन",
      "admin.thEvent": "फंक्शन",
      "admin.thSpace": "जगह",
      "admin.thGuests": "लोग",
      "admin.thStatus": "स्थिति",
      "admin.thActions": "एक्शन",
      "admin.empty": "अभी कोई बुकिंग रिक्वेस्ट नहीं — ऊपर फ़ॉर्म भरने पर यहाँ दिखेगी।",
      "admin.note": "डेमो मोड: यह डेटा इसी ब्राउज़र में सेव है। स्थिति बदलने के लिए पिल पर क्लिक करें।",
      "hero.eyebrow": "वेडिंग वेन्यू · सिविल लाइंस, नागपुर",
      "hero.t1": "आपके",
      "hero.t2": "ख़ास दिन",
      "hero.t3": "के लिए",
      "hero.sub": "सिविल लाइंस के दिल में सुंदर रखरखाव वाला गार्डन लॉन और बैंक्वेट हॉल — शादी, रिसेप्शन और 800 मेहमानों तक के जश्न के लिए एकदम सही।",
      "hero.cta": "तारीख़ चेक करें",
      "about.eyebrow": "वेन्यू के बारे में",
      "about.t1": "नागपुर में",
      "about.t2": "जश्न",
      "about.t3": "की पहचान",
      "about.lead": "वर्षों से नागपुर के परिवार अपने सबसे ख़ास पलों — शादी, रिसेप्शन, संगीत और कीर्तन — के लिए रानी कोठी लॉन्स पर भरोसा करते आए हैं। मेहमान हमारी <strong>साफ़-सुथरी सुविधाओं, विनम्र स्टाफ़ और स्वादिष्ट खाने</strong> की तारीफ़ करते हैं।",
      "spaces.eyebrow": "हमारी जगहें",
      "spaces.t1": "दो जगहें,",
      "spaces.t2": "अनंत",
      "spaces.t3": "संभावनाएँ",
      "spaces.sub": "लॉन, बैंक्वेट हॉल — या दोनों मिलाकर एक भव्य जश्न बुक करें।",
      "pkg.eyebrow": "जश्न पैकेज",
      "pkg.sub": "हर फंक्शन अलग होता है — एक शुरुआती विकल्प चुनें, फिर तारीख़, मेहमानों और मेन्यू के हिसाब से हम कोटेशन बनाएँगे।",
      "pkg.tier1": "ज़रूरी",
      "pkg.tier2": "सिग्नेचर",
      "pkg.tier3": "ग्रैंड",
      "pkg.popular": "सबसे ज़्यादा बुकिंग",
      "pkg.quote": "कस्टम कोट",
      "pkg.cta": "कोटेशन लें",
      "pkg.note": "ये सिर्फ़ प्लानिंग के स्तर हैं — अंतिम कीमत तारीख़, मौसम, मेन्यू और मेहमानों पर निर्भर है। इस हफ़्ते की दरों के लिए कॉल करें <a href=\"tel:09823170071\">098231 70071</a>।",
      "pkg1.a": "आपके चुने हुए समय के लिए लॉन",
      "pkg1.b": "साधारण मंडप और स्टेज सेटअप",
      "pkg1.c": "मेहमानों के लिए कुर्सी-मेज़",
      "pkg1.d": "पार्किंग + वेन्यू मैनेजर",
      "pkg1.e": "कैटरिंग अलग से उपलब्ध",
      "pkg2.a": "ज़रूरी पैकेज की सब कुछ",
      "pkg2.b": "पूरा शाकाहारी/नॉन-वेज मेन्यू",
      "pkg2.c": "वेलकम ड्रिंक्स और मिठाई काउंटर",
      "pkg2.d": "फंक्शन के लिए सर्विस स्टाफ़",
      "pkg2.e": "इवेंट से पहले मेन्यू टेस्टिंग",
      "pkg3.a": "लॉन + बैंक्वेट हॉल एक साथ",
      "pkg3.b": "प्रीमियम डेकोरेशन और लाइटिंग",
      "pkg3.c": "सभी फंक्शन की कैटरिंग",
      "pkg3.d": "समर्पित वेडिंग कोऑर्डिनेटर",
      "pkg3.e": "संगीत/रिसेप्शन AV सेटअप",
      "reviews.eyebrow": "मेहमानों का प्यार",
      "reviews.t1": "नागपुर",
      "reviews.t2": "क्या",
      "reviews.t3": "कहता है",
      "faq.eyebrow": "जान लीजिए",
      "faq1.q": "रानी कोठी लॉन्स में कितने मेहमान आ सकते हैं?",
      "faq1.a": "गार्डन लॉन में आराम से 800 मेहमान और बैंक्वेट हॉल में 400 तक। दोनों जगह एक साथ बुक करने पर बहु-फंक्शन शादी के लिए बढ़िया रहता है।",
      "faq2.q": "क्या आप कैटरिंग और डेकोरेशन देते हैं?",
      "faq2.a": "हाँ — मेन्यू टेस्टिंग के साथ इन-हाउस कैटरिंग, और पूरा डेकोरेशन (मंडप, स्टेज, फूलों की सजावट और लाइटिंग)। मेहमान खाने को “really worth tasting” कहते हैं।",
      "faq3.q": "क्या वेन्यू में पार्किंग है?",
      "faq3.a": "हाँ, साइट पर खूब जगह है — यह हमारे रिव्यू में सबसे ज़्यादा सराही जाने वाली सुविधाओं में से एक है।",
      "faq4.q": "मैं अपनी तारीख़ ख़ाली है या नहीं, कैसे चेक करूँ?",
      "faq4.a": "नीचे दिया बुकिंग फ़ॉर्म भरें या 098231 70071 पर कॉल करें — हम उसी दिन उपलब्धता बता देंगे। चेक करना बिलकुल मुफ़्त है।",
      "faq5.q": "क्या बुकिंग से पहले वेन्यू देख सकता हूँ?",
      "faq5.a": "बिलकुल। किसी भी दिन शाम 9 बजे तक आइए, या फ़ॉर्म से स्लॉट बुक कीजिए — हमारी टीम आपको लॉन और हॉल दिखाएगी।",
      "faq6.q": "वेन्यू ठीक कहाँ है?",
      "faq6.a": "237, टेम्पल रोड, सिविल लाइंस, नागपुर, महाराष्ट्र 440001 (Plus Code 5328+8Q) — सिविल लाइंस के बीचोबीच, पूरे शहर से आसान पहुँच।",
      "book.eyebrow": "अपनी तारीख़ बुक करें",
      "book.t1": "आइए आपके",
      "book.t2": "जश्न",
      "book.lead": "कुछ जानकारी दीजिए — हमारी टीम कुछ घंटों में कॉल करके उपलब्धता, कीमत और वेन्यू टूर कन्फ़र्म करेगी।",
      "book.submit": "बुकिंग रिक्वेस्ट भेजें ↗",
      "visit.eyebrow": "हमसे मिलिए",
      "visit.t1": "खोजिए",
      "visit.t2": "रानी कोठी",
    },
  };

  const langToggle = document.getElementById("langToggle");
  const storedLang = localStorage.getItem("raniKothiLang") || "en";

  function applyLang(lang) {
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (!dict[key]) return;
      el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const key = el.dataset.i18nPh;
      if (!dict[key]) return;
      el.placeholder = dict[key];
    });
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
    langToggle.textContent = lang === "hi" ? "EN" : "हिं";
    langToggle.classList.toggle("active", lang === "hi");
    localStorage.setItem("raniKothiLang", lang);
  }

  applyLang(storedLang);

  langToggle.addEventListener("click", () => {
    const next = (localStorage.getItem("raniKothiLang") || "en") === "en" ? "hi" : "en";
    applyLang(next);
  });

  // ---------- FAQ: only one open at a time ----------
  const faqItems = document.querySelectorAll(".faq__item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) faqItems.forEach((o) => { if (o !== item) o.open = false; });
    });
  });

  // ---------- Gallery filters ----------
  const gfBtns = [...document.querySelectorAll(".gf-btn")];
  const allGalleryItems = [...document.querySelectorAll(".gallery__item")];

  function visibleGalleryItems() {
    return allGalleryItems.filter((el) => !el.classList.contains("filtered-out"));
  }

  gfBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      gfBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      allGalleryItems.forEach((el) => {
        const show = f === "all" || el.dataset.cat === f;
        el.classList.toggle("filtered-out", !show);
      });
    });
  });

  // ---------- Gallery lightbox ----------
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  let lbIndex = 0;

  function openLightbox(i) {
    const items = visibleGalleryItems();
    if (!items.length) return;
    lbIndex = (i + items.length) % items.length;
    const item = items[lbIndex];
    const img = item.querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = item.querySelector("figcaption")?.textContent || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  allGalleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const items = visibleGalleryItems();
      openLightbox(items.indexOf(item));
    });
    item.setAttribute("tabindex", "0");
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const items = visibleGalleryItems();
        openLightbox(items.indexOf(item));
      }
    });
  });

  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  document.getElementById("lbPrev").addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox(lbIndex - 1);
  });
  document.getElementById("lbNext").addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox(lbIndex + 1);
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(lbIndex - 1);
    if (e.key === "ArrowRight") openLightbox(lbIndex + 1);
  });

  // ---------- Scroll progress + back to top ----------
  const scrollProgress = document.getElementById("scrollProgress");
  const backTop = document.getElementById("backTop");

  function onScrollFx() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    scrollProgress.style.width = pct + "%";
    backTop.classList.toggle("show", doc.scrollTop > 600);
  }
  window.addEventListener("scroll", onScrollFx, { passive: true });
  onScrollFx();
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // ---------- Print slip ----------
  let lastBooking = null;

  function fillPrintSlip(b) {
    lastBooking = b;
    const d = new Date(b.date + "T00:00:00");
    const dateStr = d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    document.getElementById("printSlipBody").innerHTML = `
      <tr><th>Guest name</th><td>${escapeHtml(b.name)}</td></tr>
      <tr><th>Phone</th><td>${escapeHtml(b.phone)}</td></tr>
      <tr><th>Event date</th><td>${escapeHtml(dateStr)}</td></tr>
      <tr><th>Event type</th><td>${escapeHtml(b.eventType)}</td></tr>
      <tr><th>Space</th><td>${escapeHtml(b.space)}</td></tr>
      <tr><th>Expected guests</th><td>${escapeHtml(String(b.guests))}</td></tr>
      ${b.message ? `<tr><th>Notes</th><td>${escapeHtml(b.message)}</td></tr>` : ""}
    `;
    document.getElementById("printSlipStatus").textContent = b.status || "Pending";
    document.getElementById("printSlipRef").textContent = "RK-" + String(b.id).slice(-8);
    document.getElementById("printSlipDate").textContent =
      "Generated on " + new Date().toLocaleString("en-IN");
    document.title = `Booking-Slip-${b.name.replace(/\s+/g, "-")}-Rani-Kothi`;
    window.print();
    document.title = "Rani Kothi Lawns — Wedding Venue in Civil Lines, Nagpur";
  }

  // print button on success screen
  document.getElementById("printSlipBtn").addEventListener("click", () => {
    const bookings = getBookings();
    if (lastBooking) fillPrintSlip(lastBooking);
    else if (bookings.length) fillPrintSlip(bookings[bookings.length - 1]);
  });

  // ---------- Admin dashboard ----------
  const STATUS_CYCLE = ["Pending", "Confirmed", "Declined"];
  const adminBody = document.getElementById("adminBody");
  const adminSearch = document.getElementById("adminSearch");

  function statusClass(s) {
    return (
      "status-pill status-pill--" +
      (s === "Pending" ? "pending" : s === "Confirmed" ? "confirmed" : s === "Waitlist" ? "waitlist" : "declined")
    );
  }

  function renderAdmin() {
    const q = (adminSearch.value || "").toLowerCase().trim();
    const bookings = getBookings();
    const filtered = bookings.filter((b) => {
      if (!q) return true;
      const hay = `${b.name} ${b.phone} ${b.date} ${b.eventType} ${b.space} ${b.status}`.toLowerCase();
      return hay.includes(q);
    });

    // stats
    document.getElementById("statTotal").textContent = bookings.length;
    document.getElementById("statPending").textContent = bookings.filter((b) => b.status === "Pending").length;
    document.getElementById("statConfirmed").textContent = bookings.filter((b) => b.status === "Confirmed").length;
    document.getElementById("statWaitlist").textContent = bookings.filter((b) => b.status === "Waitlist").length;

    adminBody.innerHTML = "";
    if (!filtered.length) {
      adminBody.innerHTML = `<tr class="admin__empty"><td colspan="8">${bookings.length ? "No bookings match your search." : "No booking requests yet — submit the form above to see them here."}</td></tr>`;
      return;
    }

    filtered
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((b) => {
        const tr = document.createElement("tr");
        const d = new Date(b.date + "T00:00:00");
        const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        tr.innerHTML = `
          <td>${escapeHtml(dateStr)}</td>
          <td>${escapeHtml(b.name)}</td>
          <td><a href="tel:${escapeHtml(b.phone)}" style="color:var(--gold-light)">${escapeHtml(b.phone)}</a></td>
          <td>${escapeHtml(b.eventType)}</td>
          <td>${escapeHtml(b.space)}</td>
          <td>${escapeHtml(String(b.guests))}</td>
          <td><button type="button" class="${statusClass(b.status)}" title="Click to change status">${escapeHtml(b.status)}</button></td>
          <td>
            <div class="admin-row-actions">
              <a class="admin-icon-btn" href="tel:${escapeHtml(b.phone)}" title="Call">📞</a>
              <button type="button" class="admin-icon-btn" data-print="${b.id}" title="Print slip">🖨️</button>
              <button type="button" class="admin-icon-btn admin-icon-btn--danger" data-del="${b.id}" title="Delete">✕</button>
            </div>
          </td>
        `;
        // cycle status: Pending → Confirmed → Declined → Pending (Waitlist → Pending)
        tr.querySelector(".status-pill").addEventListener("click", () => {
          const list = getBookings();
          const target = list.find((x) => x.id === b.id);
          if (!target) return;
          if (target.status === "Waitlist") target.status = "Pending";
          else {
            const idx = STATUS_CYCLE.indexOf(target.status);
            target.status = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
          }
          saveBookings(list);
          renderAdmin();
          renderBookings();
        });
        tr.querySelector("[data-del]").addEventListener("click", () => {
          saveBookings(getBookings().filter((x) => x.id !== b.id));
          renderAdmin();
          renderBookings();
        });
        tr.querySelector("[data-print]").addEventListener("click", () => fillPrintSlip(b));
        adminBody.appendChild(tr);
      });
  }

  adminSearch.addEventListener("input", renderAdmin);

  document.getElementById("exportCsv").addEventListener("click", () => {
    const bookings = getBookings();
    if (!bookings.length) {
      alert("No bookings to export.");
      return;
    }
    const header = ["Date", "Name", "Phone", "Event", "Space", "Guests", "Status", "Message", "Created"];
    const rows = bookings.map((b) =>
      [b.date, b.name, b.phone, b.eventType, b.space, b.guests, b.status, b.message || "", b.createdAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rani-kothi-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("clearAll").addEventListener("click", () => {
    if (!getBookings().length) return;
    if (confirm("Delete ALL booking requests? This cannot be undone.")) {
      saveBookings([]);
      renderAdmin();
      renderBookings();
    }
  });

  // re-render admin whenever bookings change from the public form
  const _origRender = renderBookings;
  renderBookings = function () {
    _origRender();
    if (document.getElementById("adminBody")) renderAdmin();
  };
  renderBookings();
})();
