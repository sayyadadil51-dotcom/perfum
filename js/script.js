/* ═══════════════════════════════════════════════════════════════
   ARJUNA CELEBRATIONS HALL — public website interactions
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Minimal IntersectionObserver fallback (older browsers, embedded webviews) */
  if (!("IntersectionObserver" in window)) {
    window.IntersectionObserver = function (cb) {
      this.observe = function (el) {
        el.classList.add("in");
        const d = parseInt(el.dataset.decimals || "0", 10);
        if (el.dataset.count) {
          el.textContent = d
            ? parseFloat(el.dataset.count).toFixed(d)
            : parseInt(el.dataset.count, 10).toLocaleString("en-IN");
        }
      };
      this.unobserve = function () {};
      this.disconnect = function () {};
    };
  }
  const phone = "919689902501";

  /* ── Footer year ─────────────────────────────────────────── */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Sticky header + mobile menu ─────────────────────────── */
  const header = $("#siteHeader");
  const navToggle = $("#navToggle");
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  };
  navToggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$("#navPrimary a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      closeSearch();
    }
  });

  /* ── Scroll reveal ───────────────────────────────────────── */
  const revealIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  $$(".reveal").forEach((el) => revealIO.observe(el));

  /* ── Active nav link ─────────────────────────────────────── */
  const navLinks = $$("#navPrimary a");
  const linkFor = new Map();
  navLinks.forEach((a) => linkFor.set(a.getAttribute("href").slice(1), a));
  const sectionIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove("is-active"));
        const link = linkFor.get(e.target.id);
        if (link) link.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  ["home", "features", "services", "pricing", "gallery", "visit"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionIO.observe(el);
  });

  /* ── Animated stat counters ──────────────────────────────── */
  const counters = $$("[data-count]");
  const countIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const duration = reduceMotion ? 0 : 1300;
        const start = performance.now();
        const tick = (now) => {
          const p = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          el.textContent = decimals
            ? val.toFixed(decimals)
            : Math.round(val).toLocaleString("en-IN");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => countIO.observe(c));

  /* ── Global search ───────────────────────────────────────── */
  const searchInput = $("#siteSearch");
  const searchPanel = $("#searchResults");
  const SEARCH_INDEX = [
    { title: "Check dates & book", desc: "Availability calendar and booking request", href: "#book", tag: "Booking" },
    { title: "The Venue package — ₹75,000", desc: "Hall, stage, tables, parking, power backup", href: "#pricing", tag: "Pricing" },
    { title: "Venue + Catering — ₹649/plate", desc: "Multi-cuisine buffet, live counters, staff", href: "#pricing", tag: "Pricing" },
    { title: "Compare what's included", desc: "The Venue vs Venue + Catering vs Full Celebration", href: "#pricing", tag: "Pricing" },
    { title: "Wedding & reception", desc: "Mandap, stage, baraat entry, up to 1,000 guests", href: "#services", tag: "Services" },
    { title: "Sangeet & haldi", desc: "Sound, light, dance floor, lawn-side haldi", href: "#services", tag: "Services" },
    { title: "Corporate & social events", desc: "Conferences, annual days, milestone parties", href: "#services", tag: "Services" },
    { title: "Photo gallery", desc: "Real setups from past weddings and receptions", href: "#gallery", tag: "Gallery" },
    { title: "Visit us & directions", desc: "Mata Mandir Main Rd, Khamla, Nagpur 440025", href: "#visit", tag: "Contact" },
    { title: "Customer reviews", desc: "4.3★ from 3,553 Google reviews", href: "#reviews", tag: "Reviews" },
    { title: "FAQ & cancellation policy", desc: "Timings, catering rules, advances, cancellations", href: "#faq", tag: "Help" },
    { title: "Admin dashboard", desc: "Bookings, revenue, enquiries and reports", href: "dashboard.html", tag: "Login" }
  ];

  function closeSearch() {
    if (!searchPanel) return;
    searchPanel.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
  }

  function renderSearch(q) {
    const query = q.trim().toLowerCase();
    if (!query) {
      searchPanel.hidden = true;
      searchInput.setAttribute("aria-expanded", "false");
      return;
    }
    const hits = SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query)
    ).slice(0, 6);

    searchPanel.innerHTML =
      `<p class="sr-label">${hits.length ? "Results" : "No results"}</p>` +
      (hits.length
        ? hits
            .map(
              (h) =>
                `<a href="${h.href}" role="option"><span><b>${h.title}</b><span>${h.desc}</span></span></a>`
            )
            .join("")
        : `<p class="sr-empty">Nothing matched “${q.trim()}”. Try “pricing”, “parking” or “sangeet”.</p>`);
    searchPanel.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
    $$("a", searchPanel).forEach((a) => a.addEventListener("click", () => { closeSearch(); searchInput.value = ""; }));
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => renderSearch(e.target.value));
    searchInput.addEventListener("focus", (e) => { if (e.target.value.trim()) renderSearch(e.target.value); });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeSearch(); searchInput.blur(); }
      if (e.key === "Enter") {
        const first = $("a", searchPanel);
        if (first) { e.preventDefault(); first.click(); }
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".header-search")) closeSearch();
    });
  }

  /* ── Availability calendar ───────────────────────────────── */
  const calDays = $("#calDays");
  const calTitle = $("#calTitle");
  const calHint = $("#calHint");
  const calPrev = $("#calPrev");
  const calNext = $("#calNext");
  const dateInput = $("#eventDate");

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const state = { view: new Date(today.getFullYear(), today.getMonth(), 1), selected: null };

  // Deterministic "already booked" pattern so the demo is stable across reloads.
  function isBooked(date) {
    const key = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
    if (date.getDay() === 6) return key % 5 < 3; // most Saturdays taken
    if (date.getDay() === 0) return key % 7 < 2;
    return key % 11 === 0;
  }

  function renderCalendar() {
    const y = state.view.getFullYear();
    const m = state.view.getMonth();
    calTitle.textContent = `${MONTHS[m]} ${y}`;
    calDays.innerHTML = "";

    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first grid
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement("span");
      empty.className = "cal-day empty";
      calDays.appendChild(empty);
    }

    const todayIso = iso(today);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";
      btn.textContent = String(d);
      btn.setAttribute("role", "gridcell");

      const thisIso = iso(date);
      const past = date < today;
      const booked = !past && isBooked(date);

      if (past) btn.classList.add("disabled");
      else if (booked) btn.classList.add("booked", "disabled");
      if (thisIso === todayIso) btn.classList.add("today");
      if (state.selected === thisIso) btn.classList.add("selected");

      if (past) {
        btn.setAttribute("aria-disabled", "true");
        btn.setAttribute("aria-label", `${d} ${MONTHS[m]} — unavailable`);
      } else if (booked) {
        btn.setAttribute("aria-disabled", "true");
        btn.setAttribute("aria-label", `${d} ${MONTHS[m]} — already booked`);
      } else {
        btn.setAttribute("aria-label", `${d} ${MONTHS[m]} — available, select date`);
        btn.addEventListener("click", () => selectDate(thisIso));
      }
      calDays.appendChild(btn);
    }

    // Don't let people navigate before the current month.
    const isCurrentMonth = y === today.getFullYear() && m === today.getMonth();
    calPrev.disabled = isCurrentMonth;
    calPrev.style.opacity = isCurrentMonth ? ".35" : "1";
    calPrev.style.cursor = isCurrentMonth ? "not-allowed" : "pointer";
  }

  function selectDate(thisIso) {
    state.selected = thisIso;
    const [yy, mm, dd] = thisIso.split("-").map(Number);
    const nice = `${dd} ${MONTHS[mm - 1]} ${yy}`;
    if (dateInput) dateInput.value = thisIso;
    clearFieldError(dateInput);
    calHint.innerHTML = `Selected <strong>${nice}</strong> — fill the form to request it.`;
    renderCalendar();
    document.getElementById("bookingForm")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  if (calDays) {
    renderCalendar();
    calPrev.addEventListener("click", () => { state.view.setMonth(state.view.getMonth() - 1); renderCalendar(); });
    calNext.addEventListener("click", () => { state.view.setMonth(state.view.getMonth() + 1); renderCalendar(); });
  }

  /* ── Booking form ────────────────────────────────────────── */
  const form = $("#bookingForm");
  const success = $("#formSuccess");

  function setFieldError(input, on) {
    if (!input) return;
    const field = input.closest(".field");
    if (field) field.classList.toggle("error", !!on);
  }
  function clearFieldError(input) { setFieldError(input, false); }

  if (form) {
    form.addEventListener("input", (e) => {
      if (e.target.closest(".field")) clearFieldError(e.target);
    });

    // Keep the calendar and the date input in sync.
    if (dateInput) {
      dateInput.addEventListener("change", () => {
        const v = dateInput.value;
        if (!v) return;
        state.selected = v;
        const d = new Date(v + "T00:00:00");
        state.view = new Date(d.getFullYear(), d.getMonth(), 1);
        renderCalendar();
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const occasion = (data.get("occasion") || "").toString().trim();
      const date = (data.get("date") || "").toString().trim();
      const guestsRaw = (data.get("guests") || "").toString().trim();
      const guests = parseInt(guestsRaw, 10);
      const name = (data.get("name") || "").toString().trim();
      const phoneVal = (data.get("phone") || "").toString().replace(/\D/g, "");
      const email = (data.get("email") || "").toString().trim();
      const notes = (data.get("notes") || "").toString().trim();
      const session = (data.get("session") || "Morning").toString();

      const checks = [
        [$("#occasion"), !!occasion],
        [$("#eventDate"), !!date && new Date(date + "T00:00:00") >= today],
        [$("#guests"), !!guests && guests >= 50 && guests <= 1000],
        [$("#name"), name.length >= 2],
        [$("#phone"), /^[6-9]\d{9}$/.test(phoneVal)],
        [$("#email"), !email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)]
      ];

      let firstInvalid = null;
      checks.forEach(([input, ok]) => {
        setFieldError(input, !ok);
        if (!ok && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        return;
      }

      const ref = "ARJ-" + String(Math.floor(1000 + Math.random() * 8999));
      $("#bookingRef").textContent = ref;

      const d = new Date(date + "T00:00:00");
      const prettyDate = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      const rows = [
        ["Occasion", occasion],
        ["Date", prettyDate],
        ["Session", session],
        ["Guests", `${guests.toLocaleString("en-IN")} guests`],
        ["Name", name],
        ["Mobile", `+91 ${phoneVal}`]
      ];
      if (email) rows.push(["Email", email]);
      if (notes) rows.push(["Notes", notes]);

      $("#successSummary").innerHTML = rows
        .map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`)
        .join("");

      const waText = encodeURIComponent(
        `Hi Arjuna Celebrations Hall, I've sent a booking request (${ref}).\n` +
          `Occasion: ${occasion}\nDate: ${prettyDate}\nSession: ${session}\nGuests: ${guests}\nName: ${name}`
      );
      $("#waConfirm").href = `https://wa.me/${phone}?text=${waText}`;

      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });

    $("#resetForm")?.addEventListener("click", () => {
      form.reset();
      state.selected = null;
      renderCalendar();
      calHint.textContent = "Pick a date to start your request.";
      $$(".field", form).forEach((f) => f.classList.remove("error"));
      success.hidden = true;
      form.hidden = false;
      $("#occasion").focus();
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ── Newsletter ──────────────────────────────────────────── */
  const newsletter = $("#newsletterForm");
  if (newsletter) {
    newsletter.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("#newsletterEmail");
      const msg = $("#newsletterMsg");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        msg.style.color = "#fca5a5";
        msg.textContent = "Please enter a valid email address.";
        return;
      }
      msg.style.color = "#34d399";
      msg.textContent = "You're on the list — offers and open dates will land in your inbox.";
      email.value = "";
    });
  }

  /* ── Opening status ──────────────────────────────────────── */
  const openChip = $("#openStatus");
  if (openChip) {
    const toMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const open = toMin(openChip.dataset.open);
    const close = toMin(openChip.dataset.close);
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const isOpen = mins >= open && mins < close;
    openChip.textContent = isOpen
      ? `Open now · closes ${openChip.dataset.close.replace(":", ":")}`
      : `Closed now · opens ${openChip.dataset.open}`;
    openChip.textContent = isOpen
      ? `Open now · till ${formatTime(close)}`
      : `Closed · opens ${formatTime(open)}`;
    openChip.classList.toggle("closed", !isOpen);
  }
  function formatTime(mins) {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const suffix = h24 >= 12 ? "PM" : "AM";
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  /* ── Popular times chart ─────────────────────────────────── */
  const ptChart = $("#ptChart");
  if (ptChart) {
    // Typical busyness 9am–9pm for a site-visit desk; evening peaks.
    const busy = [18, 26, 34, 42, 48, 40, 33, 38, 52, 66, 74, 58];
    const nowHour = new Date().getHours();
    busy.forEach((value, i) => {
      const bar = document.createElement("span");
      bar.className = "bar";
      const hour = 9 + i;
      if (hour === nowHour) bar.classList.add("active");
      bar.style.height = `${Math.max(10, value)}%`;
      bar.title = `${formatTime(hour * 60)} — ${value < 40 ? "Not too busy" : value < 65 ? "A little busy" : "Busy"}`;
      ptChart.appendChild(bar);
    });
    const ptDay = $("#ptDay");
    if (ptDay) ptDay.textContent = new Date().toLocaleDateString("en-IN", { weekday: "long" });

    const ptLive = $("#ptLive");
    if (ptLive) {
      const hour = new Date().getHours();
      const idx = Math.min(Math.max(hour - 9, 0), busy.length - 1);
      const level = busy[idx] < 40 ? "Not too busy" : busy[idx] < 65 ? "A little busy" : "Busy";
      ptLive.innerHTML = `<i></i>Live · ${level}`;
    }
  }

  /* ── Gallery lightbox ────────────────────────────────────── */
  const galleryItems = $$(".gallery-item");
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCaption = $("#lbCaption");
  let lbIndex = 0;
  let lastFocused = null;

  function openLightbox(index) {
    if (!lightbox || !galleryItems.length) return;
    lbIndex = index;
    lastFocused = document.activeElement;
    paintLightbox();
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add("open"));
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function paintLightbox() {
    const item = galleryItems[lbIndex];
    lbImg.src = item.dataset.full;
    lbImg.alt = item.dataset.caption || "";
    lbCaption.textContent = `${item.dataset.caption} · ${lbIndex + 1} / ${galleryItems.length}`;
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { lightbox.hidden = true; }, 220);
    lastFocused?.focus?.();
  }
  function stepLightbox(dir) {
    lbIndex = (lbIndex + dir + galleryItems.length) % galleryItems.length;
    paintLightbox();
  }

  galleryItems.forEach((item, i) => {
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `View photo: ${item.dataset.caption}`);
    item.addEventListener("click", () => openLightbox(i));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); }
    });
  });
  if (lightbox) {
    $("#lbClose").addEventListener("click", closeLightbox);
    $("#lbPrev").addEventListener("click", () => stepLightbox(-1));
    $("#lbNext").addEventListener("click", () => stepLightbox(1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  }

  /* ── Venue tour slideshow ────────────────────────────────── */
  const tourOpen = $("#tourOpen");
  const tourModal = $("#tourModal");
  const tourImg = $("#tourImg");
  const tourCaption = $("#tourCaption");
  const tourBar = $("#tourBar");
  const tourToggle = $("#tourToggle");
  const tourClose = $("#tourClose");

  const TOUR = [
    { src: "images/gallery-entrance.jpg", caption: "Entrance & welcome desk" },
    { src: "images/hero.jpg", caption: "Main hall, dressed for the evening" },
    { src: "images/gallery-mandap.jpg", caption: "Floral mandap on stage" },
    { src: "images/gallery-sangeet.jpg", caption: "Sangeet stage, sound & light" },
    { src: "images/gallery-tables.jpg", caption: "Banquet layout for 400" },
    { src: "images/gallery-haldi.jpg", caption: "Daytime haldi corner" }
  ];
  const SLIDE_MS = 4000;
  let tourIdx = 0;
  let tourTimer = null;
  let tourPlaying = false;
  let tourStart = 0;

  function paintTour() {
    const slide = TOUR[tourIdx];
    tourImg.src = slide.src;
    tourImg.alt = slide.caption;
    tourCaption.textContent = slide.caption;
  }
  function startTour() {
    if (!tourModal) return;
    tourIdx = 0;
    paintTour();
    tourModal.hidden = false;
    requestAnimationFrame(() => tourModal.classList.add("open"));
    document.body.style.overflow = "hidden";
    tourClose.focus();
    playTour();
  }
  function playTour() {
    clearInterval(tourTimer);
    tourPlaying = true;
    tourToggle.textContent = "Pause";
    tourStart = performance.now();
    tourBar.style.width = "0%";
    tourBar.style.transition = "none";
    requestAnimationFrame(() => {
      tourBar.style.transition = `width ${SLIDE_MS}ms linear`;
      tourBar.style.width = "100%";
    });
    tourTimer = setInterval(() => {
      tourIdx = (tourIdx + 1) % TOUR.length;
      paintTour();
      tourBar.style.transition = "none";
      tourBar.style.width = "0%";
      requestAnimationFrame(() => {
        tourBar.style.transition = `width ${SLIDE_MS}ms linear`;
        tourBar.style.width = "100%";
      });
    }, SLIDE_MS);
  }
  function pauseTour() {
    clearInterval(tourTimer);
    tourPlaying = false;
    tourToggle.textContent = "Play";
    tourBar.style.transition = "none";
  }
  function closeTour() {
    if (!tourModal) return;
    pauseTour();
    tourModal.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { tourModal.hidden = true; }, 220);
    tourOpen?.focus();
  }
  if (tourOpen && tourModal) {
    tourOpen.addEventListener("click", startTour);
    tourOpen.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startTour(); }
    });
    tourClose.addEventListener("click", closeTour);
    tourToggle.addEventListener("click", () => (tourPlaying ? pauseTour() : playTour()));
    tourModal.addEventListener("click", (e) => { if (e.target === tourModal) closeTour(); });
  }

  /* ── Global keyboard shortcuts for open modals ───────────── */
  document.addEventListener("keydown", (e) => {
    if (lightbox && !lightbox.hidden) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
    if (tourModal && !tourModal.hidden && e.key === "Escape") closeTour();
  });

  /* ── Dashboard login hand-off (demo) ─────────────────────── */
  // The Login button points at dashboard.html; nothing else to wire here.
})();
