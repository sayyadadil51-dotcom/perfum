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

    successBox.hidden = false;
  });

  document.getElementById("bookAnother").addEventListener("click", () => {
    successBox.hidden = true;
    form.reset();
    chipsWrap.querySelectorAll(".date-chip").forEach((c) => c.classList.remove("active"));
    form.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  });

  renderBookings();

  // ---------- Gallery lightbox ----------
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  const galleryItems = [...document.querySelectorAll(".gallery__item")];
  let lbIndex = 0;

  function openLightbox(i) {
    lbIndex = (i + galleryItems.length) % galleryItems.length;
    const item = galleryItems[lbIndex];
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

  galleryItems.forEach((item, i) => {
    item.addEventListener("click", () => openLightbox(i));
    item.setAttribute("tabindex", "0");
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter") openLightbox(i);
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
})();
