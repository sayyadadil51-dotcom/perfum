/* ═══════════════════════════════════════════════════════════════
   ARJUNA CELEBRATIONS HALL — interactions
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Footer year ─────────────────────────────────────────── */
  $("#year").textContent = new Date().getFullYear();

  /* ── Navbar: scroll state + mobile menu + active link ────── */
  const navbar = $("#navbar");
  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$("a", navLinks).forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  const sectionIds = ["overview", "gallery", "packages", "reviews", "visit", "faq"];
  const linkMap = new Map();
  $$("a", navLinks).forEach((a) => {
    const id = a.getAttribute("href").slice(1);
    if (sectionIds.includes(id)) linkMap.set(id, a);
  });
  const activeIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          linkMap.forEach((a) => a.classList.remove("active"));
          const link = linkMap.get(e.target.id);
          if (link) link.classList.add("active");
        }
      });
    },
    { rootMargin: "-35% 0px -55% 0px" }
  );
  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) activeIO.observe(el);
  });

  /* ── Reveal on scroll ────────────────────────────────────── */
  const revealIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el) => revealIO.observe(el));

  /* ── Animated counters ───────────────────────────────────── */
  function formatNum(n, decimals) {
    return decimals
      ? n.toFixed(decimals)
      : Math.round(n).toLocaleString("en-IN");
  }
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (prefersReduced) { el.textContent = formatNum(target, decimals); return; }
    const dur = 1600;
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(target * eased, decimals);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const countIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); }
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ── Open / closed live status ───────────────────────────── */
  (function openStatus() {
    const chip = $("#openStatus");
    if (!chip) return;
    const [oh, om] = chip.dataset.open.split(":").map(Number);
    const [ch, cm] = chip.dataset.close.split(":").map(Number);
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = mins >= oh * 60 + om && mins < ch * 60 + cm;
    const fmt = (h, m) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = ((h + 11) % 12) + 1;
      return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    };
    chip.textContent = open
      ? `Open now · closes ${fmt(ch, cm)}`
      : `Closed · opens ${fmt(oh, om)}`;
    if (!open) chip.classList.add("closed");
  })();

  /* ── Popular times chart ─────────────────────────────────── */
  (function popularTimes() {
    const chart = $("#ptChart");
    if (!chart) return;
    // Busyness % for hours 9 AM → 9 PM (typical for a celebration hall)
    const values = [12, 18, 30, 52, 68, 58, 34, 40, 55, 78, 90, 52, 18];
    const now = new Date();
    const currentHour = now.getHours();

    $("#ptDay").textContent = "· " +
      now.toLocaleDateString("en-IN", { weekday: "long" }) + "s";

    values.forEach((v, i) => {
      const bar = document.createElement("div");
      bar.className = "pt-bar";
      bar.style.height = Math.max(v, 6) + "%";
      bar.dataset.hour = 9 + i;
      if (9 + i === currentHour) bar.classList.add("live");
      chart.appendChild(bar);
    });

    // Live chip: busyness right now
    const liveChip = $("#ptLive");
    const idx = currentHour - 9;
    if (idx >= 0 && idx < values.length) {
      const v = values[idx];
      const label = v < 40 ? "Live · Not too busy" : v < 70 ? "Live · A bit busy" : "Live · Busy";
      liveChip.innerHTML = "<i></i>" + label;
    } else {
      liveChip.classList.add("closed");
      liveChip.innerHTML = "<i></i>Live · Closed now";
    }

    const ptIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { chart.classList.add("in"); obs.unobserve(chart); }
        });
      },
      { threshold: 0.5 }
    );
    ptIO.observe(chart);
  })();

  /* ── Availability calendar ──────────────────────────────── */
  const MONTHS = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calState = {
    y: today.getFullYear(),
    m: today.getMonth(),
    selected: null,
  };
  // Navigable window: current month → +4 months
  const minKey = today.getFullYear() * 12 + today.getMonth();
  const maxKey = minKey + 4;

  const calDays = $("#calDays");
  const calTitle = $("#calTitle");
  const calPrev = $("#calPrev");
  const calNext = $("#calNext");
  const dateInput = $("#date");

  const toKey = (y, m) => y * 12 + m;
  const iso = (d) =>
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");

  // Deterministic "booked" pattern (~30% of dates)
  const isBooked = (y, m, d) => (d * 31 + (m + 1) * 17 + y) % 10 < 3;

  function renderCalendar() {
    const { y, m } = calState;
    calTitle.textContent = `${MONTHS[m]} ${y}`;
    calPrev.disabled = toKey(y, m) <= minKey;
    calNext.disabled = toKey(y, m) >= maxKey;

    calDays.innerHTML = "";
    const startDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayIso = iso(today);

    for (let i = 0; i < startDow; i++) {
      const b = document.createElement("div");
      b.className = "cal-day blank";
      calDays.appendChild(b);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cal-day";
      cell.textContent = d;
      cell.setAttribute("aria-label", `${d} ${MONTHS[m]} ${y}`);

      const date = new Date(y, m, d);
      const dIso = iso(date);

      if (dIso < todayIso) {
        cell.classList.add("disabled", "past");
        cell.disabled = true;
      } else if (isBooked(y, m, d)) {
        cell.classList.add("disabled", "booked");
        cell.disabled = true;
        cell.setAttribute("aria-label", cell.getAttribute("aria-label") + " — already booked");
      } else {
        if (dIso === todayIso) cell.classList.add("today");
        if (calState.selected && dIso === iso(calState.selected)) cell.classList.add("selected");
        cell.addEventListener("click", () => {
          calState.selected = date;
          dateInput.value = dIso;
          clearError(dateInput);
          renderCalendar();
        });
      }
      calDays.appendChild(cell);
    }
  }

  calPrev.addEventListener("click", () => {
    calState.m--;
    if (calState.m < 0) { calState.m = 11; calState.y--; }
    renderCalendar();
  });
  calNext.addEventListener("click", () => {
    calState.m++;
    if (calState.m > 11) { calState.m = 0; calState.y++; }
    renderCalendar();
  });

  if (dateInput) {
    dateInput.min = iso(today);
    dateInput.addEventListener("change", () => {
      const v = dateInput.value;
      if (!v) return;
      const [y, m, d] = v.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (date < today) { calState.selected = null; return; }
      if (isBooked(y, m - 1, d)) {
        showError(dateInput, "That date is already booked — pick another.");
        calState.selected = null;
      } else {
        clearError(dateInput);
        calState.selected = date;
      }
      // Sync calendar view to the chosen month if navigable
      const key = toKey(y, m - 1);
      if (key >= minKey && key <= maxKey) { calState.y = y; calState.m = m - 1; }
      renderCalendar();
    });
  }
  renderCalendar();

  /* ── Booking form ────────────────────────────────────────── */
  const form = $("#bookingForm");
  const successPanel = $("#formSuccess");

  function fieldOf(input) { return input.closest(".field"); }
  function showError(input, msg) {
    const f = fieldOf(input);
    if (!f) return;
    f.classList.add("error");
    const err = f.querySelector(".err");
    if (err) err.textContent = msg;
  }
  function clearError(input) {
    const f = fieldOf(input);
    if (!f) return;
    f.classList.remove("error");
    const err = f.querySelector(".err");
    if (err) err.textContent = "";
  }

  function normalizePhone(raw) {
    let p = raw.replace(/[\s\-()]/g, "");
    if (p.startsWith("+91")) p = p.slice(3);
    else if (p.startsWith("91") && p.length === 12) p = p.slice(2);
    return p;
  }

  function validate() {
    let ok = true;
    let firstBad = null;

    const occasion = $("#occasion");
    if (!occasion.value) { showError(occasion, "Please choose an occasion."); ok = false; firstBad = firstBad || occasion; }
    else clearError(occasion);

    const date = $("#date");
    if (!date.value) { showError(date, "Pick a preferred date."); ok = false; firstBad = firstBad || date; }
    else if (new Date(date.value + "T00:00") < today) {
      showError(date, "Date must be today or later."); ok = false; firstBad = firstBad || date;
    } else clearError(date);

    const guests = $("#guests");
    const g = parseInt(guests.value, 10);
    if (!guests.value || isNaN(g)) { showError(guests, "Roughly how many guests?"); ok = false; firstBad = firstBad || guests; }
    else if (g < 50 || g > 1000) { showError(guests, "We host 50 – 1,000 guests."); ok = false; firstBad = firstBad || guests; }
    else clearError(guests);

    const name = $("#name");
    if (name.value.trim().length < 2) { showError(name, "Please tell us your name."); ok = false; firstBad = firstBad || name; }
    else clearError(name);

    const phone = $("#phone");
    const p = normalizePhone(phone.value);
    if (!/^[6-9]\d{9}$/.test(p)) { showError(phone, "Enter a valid 10-digit mobile number."); ok = false; firstBad = firstBad || phone; }
    else clearError(phone);

    const email = $("#email");
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      showError(email, "That email doesn't look right."); ok = false; firstBad = firstBad || email;
    } else clearError(email);

    if (!ok && firstBad) firstBad.focus();
    return ok;
  }

  function prettyDate(isoStr) {
    const d = new Date(isoStr + "T00:00");
    return d.toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      occasion: $("#occasion").value,
      date: $("#date").value,
      session: form.querySelector('input[name="session"]:checked').value,
      guests: $("#guests").value,
      name: $("#name").value.trim(),
      phone: normalizePhone($("#phone").value),
      email: $("#email").value.trim(),
      notes: $("#notes").value.trim(),
    };
    const ref = "ARJ-" + Math.floor(1000 + Math.random() * 9000);

    // Fill success summary
    $("#bookingRef").textContent = ref;
    $("#successSummary").innerHTML = [
      ["Occasion", data.occasion],
      ["Date", prettyDate(data.date)],
      ["Session", data.session],
      ["Guests", data.guests],
      ["Name", data.name],
      ["Phone", "+91 " + data.phone],
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    // Prefilled WhatsApp confirmation message
    const msg =
      `Hi Arjuna Celebrations Hall! I just sent a booking request (Ref: ${ref}).\n` +
      `Occasion: ${data.occasion}\nDate: ${prettyDate(data.date)}\n` +
      `Session: ${data.session}\nGuests: ${data.guests}\nName: ${data.name}`;
    $("#waConfirm").href =
      "https://wa.me/919689902501?text=" + encodeURIComponent(msg);

    // Persist locally (demo — no backend)
    try {
      const all = JSON.parse(localStorage.getItem("arjunaBookings") || "[]");
      all.push({ ref, ...data, at: new Date().toISOString() });
      localStorage.setItem("arjunaBookings", JSON.stringify(all));
    } catch (_) { /* private mode etc. */ }

    form.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  });

  $("#resetForm").addEventListener("click", () => {
    form.reset();
    form.hidden = false;
    successPanel.hidden = true;
    $$(".field.error", form).forEach((f) => f.classList.remove("error"));
    form.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  });

  // Clear errors as the user types
  $$("input, select, textarea", form).forEach((el) =>
    el.addEventListener("input", () => clearError(el))
  );

  /* ── Gallery lightbox ────────────────────────────────────── */
  (function lightbox() {
    const items = $$(".g-item");
    if (!items.length) return;
    const lb = $("#lightbox");
    const lbImg = $("#lbImg");
    const lbCaption = $("#lbCaption");
    let idx = 0;

    const IMAGES = items.map((it) => ({
      src: $("img", it).src,
      alt: $("img", it).alt,
      caption: it.dataset.caption || "",
    }));

    function show(i) {
      idx = (i + IMAGES.length) % IMAGES.length;
      const im = IMAGES[idx];
      lbImg.src = im.src;
      lbImg.alt = im.alt;
      lbCaption.textContent = im.caption;
    }
    function open(i) {
      show(i);
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      $("#lbClose").focus();
    }
    function close() {
      lb.hidden = true;
      document.body.style.overflow = "";
    }

    items.forEach((it, i) => it.addEventListener("click", () => open(i)));
    $("#lbClose").addEventListener("click", close);
    $("#lbPrev").addEventListener("click", () => show(idx - 1));
    $("#lbNext").addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  })();
})();
