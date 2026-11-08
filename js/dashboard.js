/* ═══════════════════════════════════════════════════════════════
   ARJUNA DASHBOARD — rendering, tables, CRUD, settings, boot
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const icon = (id, cls) => `<svg class="ic ${cls || ""}"><use href="#${id}"/></svg>`;
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = (s) => new Date(s + "T00:00:00");
  const fmtDate = (s) => parse(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtDateShort = (s) => parse(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
  const inrCompact = (n) => {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + "Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + "L";
    if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
    return "₹" + Math.round(n);
  };
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  const initials = (name) =>
    name
      .replace(/[^A-Za-z ]/g, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

  /* ═════════ demo data (deterministic, generated in-browser) ═════════ */
  let _seed = 20261108;
  const rnd = () => {
    _seed = (_seed * 1664525 + 1013904223) % 4294967296;
    return _seed / 4294967296;
  };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  const OCCASIONS = ["Wedding", "Reception", "Engagement", "Sangeet", "Haldi / Mehndi", "Corporate event", "Birthday / Anniversary"];
  const SESSIONS = ["Morning (9 AM – 2 PM)", "Evening (4 PM – 9 PM)", "Full day"];
  const PACKAGES = ["The Venue", "Venue + Catering", "Full Celebration"];
  const FIRST = ["Rahul", "Priya", "Sanket", "Shruti", "Rajendra", "Pooja", "Amit", "Sneha", "Vikas", "Anjali", "Nikhil", "Tanvi", "Manoj", "Kavita", "Harsh", "Divya", "Sagar", "Meera", "Yash", "Ritika", "Suresh", "Neha", "Gaurav", "Isha"];
  const LAST = ["Sharma", "Patil", "Deshmukh", "Wanjari", "Kulkarni", "Joshi", "Inamdar", "Bhagat", "Rangari", "Choudhari", "Agrawal", "Meshram", "Gadkari", "Nerkar", "Dongre", "Saoji"];
  const COMPANIES = ["Tata Motors", "HCL Nagpur", "Wainganga Foods", "Persistent Labs", "Orange City Realty", "Vidarbha Textiles"];
  const CITIES = ["Nagpur", "Nagpur", "Nagpur", "Wardha", "Amravati", "Bhandara", "Chandrapur"];

  function buildData() {
    const customers = [];
    const bookings = [];
    const invoices = [];

    const used = new Set();
    for (let i = 0; i < 26; i++) {
      const corp = i < 4;
      let name = corp ? COMPANIES[i] : `${pick(FIRST)} ${pick(LAST)}`;
      let guard = 0;
      while (used.has(name) && guard++ < 40) name = `${pick(FIRST)} ${pick(LAST)}`;
      used.add(name);
      customers.push({
        id: "CU-" + String(1024 + i),
        name,
        type: corp ? "Corporate" : "Family",
        phone: "+91 " + between(70, 99) + String(between(100, 999)) + " " + String(between(10000, 99999)),
        email: (corp ? "events" : name.split(" ")[0].toLowerCase()) + "@" + (corp ? "corp" : "gmail") + ".com",
        city: pick(CITIES),
        events: 0,
        spend: 0,
        lastBooking: null,
        status: "confirmed"
      });
    }

    const base = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    let seq = 1041;

    for (let m = -11; m <= 4; m++) {
      const monthStart = new Date(base.getFullYear(), base.getMonth() + m, 1);
      const count = m < 0 ? between(3, 5) : between(2, 4);
      for (let k = 0; k < count; k++) {
        const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), between(2, 27));
        const customer = pick(customers);
        const occasion = pick(OCCASIONS);
        const guests = between(80, 1000);
        const pkg = pick(PACKAGES);
        const session = pick(SESSIONS);
        const hall = guests > 700 ? "Both halls" : pick(["Hall A", "Hall B"]);
        const hallBase = pkg === "The Venue" ? 75000 : 95000;
        const perPlate = pkg === "Full Celebration" ? 949 : pkg === "Venue + Catering" ? 649 : 0;
        let amount = hallBase + guests * perPlate;
        if (session === "Full day") amount *= 1.6;
        amount = Math.round(amount / 500) * 500;

        let status;
        if (date < TODAY) status = rnd() < 0.86 ? "completed" : "cancelled";
        else {
          const r = rnd();
          status = r < 0.5 ? "confirmed" : r < 0.87 ? "pending" : "cancelled";
        }

        const created = new Date(date.getTime() - between(20, 150) * 86400000);
        const booking = {
          id: "BK-" + seq++,
          customerId: customer.id,
          customer: customer.name,
          phone: customer.phone,
          email: customer.email,
          date: iso(date),
          created: iso(created > TODAY ? TODAY : created),
          occasion,
          guests,
          amount,
          status,
          session,
          package: pkg,
          hall,
          notes: rnd() < 0.35 ? "Wants marigold + ivory theme; menu tasting before final count." : ""
        };
        bookings.push(booking);

        if (status !== "cancelled") {
          customer.events += 1;
          customer.spend += amount;
          if (!customer.lastBooking || parse(booking.date) > parse(customer.lastBooking)) customer.lastBooking = booking.date;
        } else if (customer.status !== "confirmed") {
          customer.status = "cancelled";
        } else if (status === "pending" && customer.status !== "confirmed") {
          customer.status = "pending";
        }
        if (status === "pending") customer.status = customer.status === "cancelled" ? "cancelled" : "pending";
      }
    }

    bookings.sort((a, b) => (a.date < b.date ? 1 : -1));

    let invSeq = 0;
    bookings
      .filter((b) => b.status !== "cancelled")
      .slice(0, 34)
      .forEach((b) => {
        invSeq += 1;
        const issued = parse(b.date);
        issued.setDate(issued.getDate() - between(18, 55));
        const due = new Date(issued.getTime() + 14 * 86400000);
        let status;
        if (b.status === "pending") status = rnd() < 0.45 ? "paid" : "pending";
        else status = rnd() < 0.76 ? "paid" : due < TODAY ? "failed" : "pending";
        invoices.push({
          id: "INV-" + TODAY.getFullYear() + "-" + String(invSeq).padStart(3, "0"),
          bookingId: b.id,
          customer: b.customer,
          customerId: b.customerId,
          issued: iso(issued),
          due: iso(due),
          amount: status === "paid" ? b.amount : Math.round((b.amount * 0.25) / 500) * 500,
          total: b.amount,
          status
        });
      });

    const pendingNow = bookings.filter((b) => b.status === "pending").length;
    const activity = [
      { ic: "i-check-circle", text: "<b>Amit</b> confirmed a reception for 400 guests", time: "8 minutes ago" },
      { ic: "i-rupee", text: "Advance of <b>₹38,750</b> received from <b>Priya Patil</b>", time: "42 minutes ago" },
      { ic: "i-calendar", text: "<b>Sneha</b> moved a sangeet from 12 Dec to 14 Dec", time: "2 hours ago" },
      { ic: "i-user", text: "<b>Rahul Sharma</b> submitted a new enquiry via the website", time: "4 hours ago" },
      { ic: "i-invoice", text: "Invoice <b>INV-2026-008</b> marked overdue", time: "Yesterday, 17:05" },
      { ic: "i-download", text: "<b>Adil</b> exported the October revenue report", time: "Yesterday, 09:20" }
    ];

    const notifications = [
      { id: 1, ic: "i-alert", tone: "amber", title: `${pendingNow} bookings need a decision`, body: "Pending requests are waiting on a call back.", time: "10 min ago", unread: true },
      { id: 2, ic: "i-rupee", tone: "green", title: "Payment received", body: "₹38,750 advance from Priya Patil.", time: "1 hour ago", unread: true },
      { id: 3, ic: "i-user", tone: "", title: "New enquiry", body: "Corporate event, 300 guests, next quarter.", time: "3 hours ago", unread: true }
    ];

    return { customers, bookings, invoices, activity, notifications };
  }

  const D = buildData();

  /* ═════════ state ═════════ */
  const S = {
    view: "overview",
    range: 30,
    reportRange: 30,
    role: "admin",
    user: { name: "Adil Sayyad", email: "admin@arjunahall.in", role: "Super Admin", avatar: "AS" },
    theme: "light",
    mini: false,
    sparks: true,
    compact: false,
    animate: true,
    tab: "profile",
    search: { bookings: "", customers: "", invoices: "" },
    filter: { bookings: "all", customers: "all", invoices: "all" },
    sort: { bookings: { key: "date", dir: -1 }, customers: { key: "spend", dir: -1 } },
    page: { bookings: 1, customers: 1, invoices: 1 },
    perPage: 8
  };

  const VIEW_META = {
    overview: ["Overview", "Welcome back, Adil — here's how the hall is doing."],
    revenue: ["Sales & Revenue", "Packages, sessions and the months that carry the year."],
    users: ["Customers", "Every family and company that has enquired or booked."],
    orders: ["Bookings", "Requests, holds and confirmed events across both halls."],
    invoices: ["Invoices & Billing", "Advances, balances and payment status."],
    reports: ["Reports & Export", "Download the numbers that matter."],
    settings: ["System Settings", "Profile, security, team roles and appearance."]
  };

  /* ═════════ toasts ═════════ */
  function toast(title, msg, tone) {
    const stack = $("#toastStack");
    const el = document.createElement("div");
    el.className = "toast" + (tone ? " " + tone : "");
    el.innerHTML = `${icon(tone === "error" ? "i-alert" : tone === "info" ? "i-bell" : "i-check-circle")}
      <div><b>${esc(title)}</b>${msg ? "<br>" + esc(msg) : ""}</div>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 280);
    }, 3600);
  }

  /* ═════════ theme / sidebar ═════════ */
  function applyTheme(theme, redraw) {
    S.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("arjuna:theme", theme);
    const tq = $("#themeQuick");
    if (tq) tq.innerHTML = `${icon(theme === "dark" ? "i-sun" : "i-moon")}Switch to ${theme === "dark" ? "light" : "dark"} theme`;
    const radio = $$('input[name="themeChoice"]').find((r) => r.value === theme);
    if (radio) radio.checked = true;
    if (redraw !== false) renderAllCharts();
  }
  function applyMini(on) {
    S.mini = on;
    document.body.classList.toggle("sidebar-mini", on);
    localStorage.setItem("arjuna:mini", on);
    const sw = $("#miniSidebar");
    if (sw) sw.checked = on;
    renderAllCharts();
  }

  /* ═════════ charts ═════════ */
  const W = 780, H = 290;
  const PAD = { t: 16, r: 14, b: 30, l: 52 };

  function curvePath(pts) {
    if (!pts.length) return "";
    if (pts.length < 3) return "M" + pts.map((p) => `${p.x} ${p.y}`).join(" L");
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const t = 0.18;
      const c1x = p1.x + (p2.x - p0.x) * t;
      const c1y = p1.y + (p2.y - p0.y) * t;
      const c2x = p2.x - (p3.x - p1.x) * t;
      const c2y = p2.y - (p3.y - p1.y) * t;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }
  function niceMax(v) {
    if (v <= 0) return 10;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / mag;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * mag;
  }

  function lineChart(wrapId, tipId, cfg) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.querySelector("svg")?.remove();
    const tip = document.getElementById(tipId);
    const labels = cfg.labels;
    const series = cfg.series;
    const maxVal = Math.max(...series.flatMap((s) => s.data), 1);
    const top = niceMax(maxVal * 1.08);
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const x = (i) => PAD.l + (labels.length === 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
    const y = (v) => PAD.t + innerH - (v / top) * innerH;
    const uid = cfg.id;

    let svg = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.aria || "Chart")}"><defs>`;
    series.forEach((s, si) => {
      svg += `<linearGradient id="g-${uid}-${si}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${s.color}" stop-opacity=".24"/>
        <stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`;
    });
    svg += `</defs>`;

    for (let i = 0; i <= 4; i++) {
      const val = (top / 4) * i;
      const yy = y(val);
      svg += `<line class="grid-line" x1="${PAD.l}" y1="${yy.toFixed(1)}" x2="${W - PAD.r}" y2="${yy.toFixed(1)}" ${i ? 'stroke-dasharray="3 5"' : ""}/>`;
      svg += `<text class="axis-label" x="${PAD.l - 10}" y="${(yy + 3.5).toFixed(1)}" text-anchor="end">${cfg.money ? inrCompact(val) : Math.round(val)}</text>`;
    }
    const every = labels.length > 14 ? 2 : 1;
    labels.forEach((lb, i) => {
      if (i % every !== 0 && i !== labels.length - 1) return;
      svg += `<text class="axis-label" x="${x(i).toFixed(1)}" y="${H - 9}" text-anchor="middle">${esc(lb)}</text>`;
    });

    series.forEach((s, si) => {
      const pts = s.data.map((v, i) => ({ x: x(i), y: y(v) }));
      const d = curvePath(pts);
      if (s.area !== false) {
        svg += `<path d="${d} L${x(labels.length - 1).toFixed(1)} ${(PAD.t + innerH).toFixed(1)} L${PAD.l} ${(PAD.t + innerH).toFixed(1)} Z" fill="url(#g-${uid}-${si})"/>`;
      }
      svg += `<path class="draw-line" d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.3}" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (s.dots !== false) {
        pts.forEach((p, i) => {
          svg += `<circle class="dot" data-i="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.4" fill="var(--surface)" stroke="${s.color}" stroke-width="2" opacity="0"/>`;
        });
      }
    });

    labels.forEach((lb, i) => {
      const step = innerW / Math.max(labels.length - 1, 1);
      svg += `<rect data-hover="${i}" x="${(PAD.l + i * step - step / 2).toFixed(1)}" y="${PAD.t}" width="${step.toFixed(1)}" height="${innerH}" fill="transparent"/>`;
    });
    svg += `<line class="hover-line" x1="0" y1="${PAD.t}" x2="0" y2="${PAD.t + innerH}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="3 4" opacity="0"/>`;
    svg += `</svg>`;
    wrap.insertAdjacentHTML("beforeend", svg);
    const svgEl = wrap.querySelector("svg");

    if (cfg.animate !== false && !reduceMotion) {
      $$("path.draw-line", svgEl).forEach((p) => {
        if (typeof p.getTotalLength !== "function") return;
        const len = p.getTotalLength();
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset 1s cubic-bezier(.22,.8,.3,1)";
        p.style.strokeDashoffset = "0";
      });
    }

    const hoverLine = svgEl.querySelector(".hover-line");
    const dots = $$(".dot", svgEl);
    $$("rect[data-hover]", svgEl).forEach((rect) => {
      rect.addEventListener("mouseenter", () => {
        const i = +rect.dataset.hover;
        const bx = rect.getBoundingClientRect();
        const cx = wrap.getBoundingClientRect();
        hoverLine.setAttribute("x1", x(i));
        hoverLine.setAttribute("x2", x(i));
        hoverLine.setAttribute("opacity", "1");
        dots.forEach((d) => d.setAttribute("opacity", +d.dataset.i === i ? "1" : "0"));
        if (tip) {
          tip.innerHTML =
            `<b>${esc(labels[i])}</b>` +
            series.map((s) => `<span style="display:block;color:${s.color}">${esc(s.name)}: ${cfg.money ? inr(s.data[i]) : s.data[i]}</span>`).join("");
          tip.classList.add("show");
          const valTop = Math.min(...series.map((s) => y(s.data[i])));
          tip.style.left = Math.max(70, Math.min(bx.left + bx.width / 2 - cx.left, cx.width - 70)) + "px";
          tip.style.top = Math.max(valTop - 10, 6) + "px";
        }
      });
      rect.addEventListener("mouseleave", () => {
        hoverLine.setAttribute("opacity", "0");
        dots.forEach((d) => d.setAttribute("opacity", "0"));
        if (tip) tip.classList.remove("show");
      });
    });
  }

  function barChart(wrapId, tipId, cfg) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.querySelector("svg")?.remove();
    const tip = document.getElementById(tipId);
    const labels = cfg.labels;
    const values = cfg.data;
    const top = niceMax(Math.max(...values, 1) * 1.12);
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const slot = innerW / labels.length;
    const bw = Math.min(slot * 0.5, 44);
    const y = (v) => PAD.t + innerH - (v / top) * innerH;

    let svg = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.aria || "Bar chart")}">`;
    for (let i = 0; i <= 4; i++) {
      const val = (top / 4) * i;
      const yy = y(val);
      svg += `<line class="grid-line" x1="${PAD.l}" y1="${yy.toFixed(1)}" x2="${W - PAD.r}" y2="${yy.toFixed(1)}" ${i ? 'stroke-dasharray="3 5"' : ""}/>`;
      svg += `<text class="axis-label" x="${PAD.l - 10}" y="${(yy + 3.5).toFixed(1)}" text-anchor="end">${cfg.suffix ? Math.round(val) + cfg.suffix : cfg.money ? inrCompact(val) : Math.round(val)}</text>`;
    }
    values.forEach((v, i) => {
      const cx = PAD.l + slot * i + slot / 2;
      const hgt = Math.max(PAD.t + innerH - y(v), 2);
      const color = Array.isArray(cfg.color) ? cfg.color[i % cfg.color.length] : cfg.color;
      svg += `<rect class="bar" data-i="${i}" x="${(cx - bw / 2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw}" height="${hgt.toFixed(1)}" rx="6" fill="${color}" style="transform-origin:${cx.toFixed(1)}px ${(PAD.t + innerH).toFixed(1)}px"/>`;
      svg += `<text class="axis-label" x="${cx.toFixed(1)}" y="${H - 9}" text-anchor="middle">${esc(labels[i])}</text>`;
    });
    values.forEach((v, i) => {
      const cx = PAD.l + slot * i + slot / 2;
      svg += `<rect data-hover="${i}" x="${(cx - slot / 2).toFixed(1)}" y="${PAD.t}" width="${slot.toFixed(1)}" height="${innerH}" fill="transparent"/>`;
    });
    svg += `</svg>`;
    wrap.insertAdjacentHTML("beforeend", svg);
    const svgEl = wrap.querySelector("svg");

    if (S.animate && !reduceMotion) {
      $$("rect.bar", svgEl).forEach((r, i) => {
        r.style.transform = "scaleY(0)";
        r.style.transition = `transform .75s cubic-bezier(.22,.8,.3,1) ${i * 45}ms`;
        requestAnimationFrame(() => { r.style.transform = "scaleY(1)"; });
      });
    }

    $$("rect[data-hover]", svgEl).forEach((rect) => {
      rect.addEventListener("mouseenter", () => {
        const i = +rect.dataset.hover;
        const bx = rect.getBoundingClientRect();
        const cx = wrap.getBoundingClientRect();
        if (tip) {
          tip.innerHTML = `<b>${esc(labels[i])}</b><span>${cfg.suffix ? values[i] + cfg.suffix : cfg.money ? inr(values[i]) : values[i]}</span>`;
          tip.classList.add("show");
          tip.style.left = Math.max(70, Math.min(bx.left + bx.width / 2 - cx.left, cx.width - 70)) + "px";
          tip.style.top = Math.max(y(values[i]) - 8, 6) + "px";
        }
      });
      rect.addEventListener("mouseleave", () => tip && tip.classList.remove("show"));
    });
  }

  function sparkline(data, color) {
    const w = 118, h = 46;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * w,
      y: h - 4 - ((v - min) / Math.max(max - min, 1)) * (h - 14)
    }));
    const d = curvePath(pts);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true" preserveAspectRatio="none">
      <path d="${d} L${w} ${h} L0 ${h} Z" fill="${color}" opacity=".1"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;
  }

  function donutRender() {
    const segs = $("#donutSegs");
    if (!segs) return;
    const groups = {};
    D.bookings.forEach((b) => {
      if (b.status === "cancelled") return;
      const key =
        ["Wedding", "Reception", "Engagement"].includes(b.occasion)
          ? "Wedding & reception"
          : ["Sangeet", "Haldi / Mehndi"].includes(b.occasion)
          ? "Sangeet & haldi"
          : b.occasion === "Corporate event"
          ? "Corporate"
          : "Birthday & social";
      groups[key] = (groups[key] || 0) + 1;
    });
    const colors = { "Wedding & reception": "#2563eb", "Sangeet & haldi": "#10b981", Corporate: "#f59e0b", "Birthday & social": "#7c3aed" };
    const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    const r = 48;
    const C = 2 * Math.PI * r;
    let off = 0;
    segs.innerHTML = entries
      .map(([name, v]) => {
        const len = (v / total) * C;
        const dash = Math.max(len - 3, 0);
        const seg = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${colors[name] || "#64748b"}" stroke-width="18"
          stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}">
          <title>${esc(name)}: ${v} bookings</title></circle>`;
        off += len;
        return seg;
      })
      .join("");
    const totalEl = $("#donutTotal");
    if (totalEl) totalEl.textContent = total;
    const legend = $("#donutLegend");
    if (legend) {
      legend.innerHTML = entries
        .map(
          ([name, v]) =>
            `<div><i style="background:${colors[name] || "#64748b"}"></i>${esc(name)}<b>${Math.round((v / total) * 100)}%</b></div>`
        )
        .join("");
    }
  }

  /* ═════════ derived data ═════════ */
  const active = () => D.bookings.filter((b) => b.status !== "cancelled");
  const collected = () => D.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const bookedValue = () => active().reduce((s, b) => s + b.amount, 0);
  const pendingCount = () => D.bookings.filter((b) => b.status === "pending").length;

  function months12() {
    const out = [];
    const base = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[d.getMonth()] });
    }
    return out;
  }
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  function seriesFor(field) {
    const ms = months12();
    return ms.map((m) => {
      const list = D.bookings.filter((b) => monthKey(parse(b.date)) === m.key && b.status !== "cancelled");
      return field === "amount" ? list.reduce((s, b) => s + b.amount, 0) : list.length;
    });
  }

  function pctChange(series) {
    const last = series[series.length - 1];
    const prev = series[series.length - 2] || 1;
    return ((last - prev) / Math.max(prev, 1)) * 100;
  }

  /* ═════════ KPI ═════════ */
  function kpiCard(o) {
    return `<article class="kpi">
      <div class="kpi-head">
        <span class="kpi-label">${esc(o.label)}</span>
        <span class="kpi-ic ${o.tone || ""}">${icon(o.ic)}</span>
      </div>
      <div class="kpi-value">${o.value}</div>
      <div class="kpi-foot">
        ${o.trend ? `<span class="trend ${o.dir || "up"}">${icon(o.dir === "down" ? "i-arrow-down" : "i-arrow-up")}${esc(o.trend)}</span>` : ""}
        <span>${esc(o.sub || "")}</span>
      </div>
      ${o.spark && S.sparks ? sparkline(o.spark, o.color || "#2563eb").replace("<svg ", '<svg data-spark="1" ') : ""}
    </article>`;
  }

  function renderOverview() {
    const amountSeries = seriesFor("amount");
    const bookingSeries = seriesFor("count");
    const revTrend = pctChange(amountSeries);
    const bookTrend = pctChange(bookingSeries);

    $("#kpiGrid").innerHTML = [
      kpiCard({
        label: "Total revenue",
        value: inrCompact(bookedValue()),
        trend: `${revTrend >= 0 ? "+" : ""}${revTrend.toFixed(1)}%`,
        dir: revTrend >= 0 ? "up" : "down",
        sub: "vs last month",
        ic: "i-rupee",
        spark: amountSeries,
        color: "#2563eb"
      }),
      kpiCard({
        label: "Total users",
        value: D.customers.length.toLocaleString("en-IN"),
        trend: "+8.5%",
        sub: "enquiries this month",
        ic: "i-users",
        tone: "green",
        spark: D.customers.map((c, i) => c.events + i % 4),
        color: "#10b981"
      }),
      kpiCard({
        label: "Bookings / tasks",
        value: active().length.toLocaleString("en-IN"),
        trend: `${bookTrend >= 0 ? "+" : ""}${bookTrend.toFixed(1)}%`,
        dir: bookTrend >= 0 ? "up" : "down",
        sub: "confirmed & completed",
        ic: "i-box",
        tone: "amber",
        spark: bookingSeries,
        color: "#f59e0b"
      }),
      kpiCard({
        label: "Pending action",
        value: String(pendingCount()),
        trend: "Urgent review",
        dir: "neutral",
        sub: "requests awaiting a call",
        ic: "i-clock",
        tone: "violet",
        spark: [4, 6, 5, 8, 7, 9, 6, 8, 10, 7, 9, pendingCount()],
        color: "#7c3aed"
      })
    ].join("");

    // growth chart
    const ms = months12();
    lineChart("growthChartWrap", "growthTip", {
      id: "growth",
      labels: ms.map((m) => m.label),
      series: [
        { name: "Bookings", data: bookingSeries, color: "#2563eb" },
        { name: "Enquiries", data: bookingSeries.map((v, i) => v + 4 + ((i * 3) % 6)), color: "#10b981" }
      ],
      aria: "Monthly bookings and enquiries"
    });

    donutRender();

    // recent table
    const recent = [...D.bookings].sort((a, b) => (a.created < b.created ? 1 : -1)).slice(0, 5);
    $("#recentTable tbody").innerHTML = recent
      .map(
        (b) => `<tr>
        <td><span class="cell-id">${esc(b.id)}</span></td>
        <td><div class="cell-customer"><span class="avatar">${initials(b.customer)}</span>
          <div><b>${esc(b.customer)}</b><small>${esc(b.occasion)}</small></div></div></td>
        <td>${esc(fmtDate(b.date))}</td>
        <td class="cell-amount">${inr(b.amount)}</td>
        <td>${badge(b.status)}</td>
        <td><button class="row-btn" data-open-booking="${esc(b.id)}" aria-label="View ${esc(b.id)}">${icon("i-eye")}</button></td>
      </tr>`
      )
      .join("");
    $("#recentTotal").textContent = D.bookings.length;

    // activity
    $("#activityFeed").innerHTML = D.activity
      .slice(0, 5)
      .map(
        (a) => `<div class="activity-item">
        <span class="act-ic">${icon(a.ic)}</span>
        <div><p>${a.text}</p><small>${esc(a.time)}</small></div></div>`
      )
      .join("");

    $("#badgeOrders").textContent = pendingCount();
    $("#badgeCustomers").textContent = D.customers.length;
    renderAllCharts();
  }

  function renderRevenue() {
    const amountSeries = seriesFor("amount");
    const paid = collected();
    const booked = bookedValue();
    const pending = Math.max(booked - paid, 0);
    const avg = active().length ? booked / active().length : 0;

    $("#revenueKpis").innerHTML = [
      kpiCard({ label: "Collected", value: inrCompact(paid), trend: "+12.4%", sub: "paid invoices", ic: "i-check-circle", tone: "green", spark: amountSeries.map((v) => v * 0.7), color: "#10b981" }),
      kpiCard({ label: "Booked value", value: inrCompact(booked), trend: "+14.2%", sub: "confirmed events", ic: "i-rupee", spark: amountSeries, color: "#2563eb" }),
      kpiCard({ label: "Outstanding", value: inrCompact(pending), trend: `${D.invoices.filter((i) => i.status !== "paid").length} open`, dir: "neutral", sub: "advances & balances", ic: "i-clock", tone: "amber", spark: amountSeries.map((v) => v * 0.3), color: "#f59e0b" }),
      kpiCard({ label: "Average booking", value: inrCompact(avg), trend: "+3.8%", sub: "per event", ic: "i-trend", tone: "violet", spark: amountSeries.map((v, i) => v / Math.max(bookingSeriesFor(i), 1)), color: "#7c3aed" })
    ].join("");

    const ms = months12();
    lineChart("revenueChartWrap", "revenueTip", {
      id: "rev",
      labels: ms.map((m) => m.label),
      series: [
        { name: "Collected", data: amountSeries.map((v) => Math.round(v * 0.72)), color: "#2563eb" },
        { name: "Booked", data: amountSeries, color: "#f59e0b" }
      ],
      money: true,
      aria: "Revenue collected versus booked value"
    });

    // package breakdown
    const byPkg = {};
    active().forEach((b) => { byPkg[b.package] = (byPkg[b.package] || 0) + b.amount; });
    const pkgTotal = Object.values(byPkg).reduce((s, v) => s + v, 0) || 1;
    const pkgColors = { "The Venue": "#2563eb", "Venue + Catering": "#10b981", "Full Celebration": "#7c3aed" };
    $("#packageBreakdown").innerHTML = Object.entries(byPkg)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([name, val]) => `<div class="mini-row">
        <span class="mini-ic" style="color:${pkgColors[name] || "#64748b"}">${icon("i-box")}</span>
        <div class="grow"><b>${esc(name)}</b><small>${Math.round((val / pkgTotal) * 100)}% of value</small>
          <div class="progress-bar"><i style="width:${(val / pkgTotal) * 100}%;background:${pkgColors[name] || "#64748b"}"></i></div>
        </div>
        <span class="val">${inrCompact(val)}</span></div>`
      )
      .join("");

    // session bar chart
    const sessions = ["Morning (9 AM – 2 PM)", "Evening (4 PM – 9 PM)", "Full day"];
    const sessionVals = sessions.map((s) => active().filter((b) => b.session === s).reduce((sum, b) => sum + b.amount, 0));
    barChart("sessionChartWrap", "sessionTip", {
      labels: ["Morning", "Evening", "Full day"],
      data: sessionVals,
      color: ["#2563eb", "#0ea5e9", "#7c3aed"],
      money: true,
      aria: "Revenue by session"
    });

    // MoM list
    $("#momList").innerHTML = ms
      .slice(-6)
      .map((m, i) => {
        const idx = ms.findIndex((x) => x.key === m.key);
        const v = amountSeries[idx];
        const prev = amountSeries[idx - 1] || 1;
        const ch = ((v - prev) / Math.max(prev, 1)) * 100;
        return `<div class="mini-row">
          <span class="mini-ic">${icon("i-calendar")}</span>
          <div class="grow"><b>${esc(m.label)} ${m.key.split("-")[0]}</b><small>${inrCompact(v)} booked</small></div>
          <span class="trend ${ch >= 0 ? "up" : "down"}">${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%</span></div>`;
      })
      .join("");

    renderAllCharts();
  }

  function bookingSeriesFor() {
    return Math.max(Math.round(bookedValue() / 90000), 1);
  }

  function renderCustomers() {
    const totalSpend = D.customers.reduce((s, c) => s + c.spend, 0);
    $("#customerKpis").innerHTML = [
      kpiCard({ label: "Customers", value: D.customers.length, trend: "+4", sub: "new this month", ic: "i-users", spark: [12, 15, 14, 18, 17, 21, 20, 24, 23, 26, 25, D.customers.length] }),
      kpiCard({ label: "Repeat guests", value: D.customers.filter((c) => c.events > 1).length, trend: "+2", sub: "booked more than once", ic: "i-refresh", tone: "green", spark: [2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 9], color: "#10b981" }),
      kpiCard({ label: "Lifetime value", value: inrCompact(totalSpend), trend: "+11.2%", sub: "across all customers", ic: "i-rupee", tone: "amber", spark: [30, 34, 32, 38, 41, 39, 45, 48, 46, 52, 55, 58], color: "#f59e0b" }),
      kpiCard({ label: "Average rating", value: "4.3", trend: "stable", sub: "3,553 Google reviews", ic: "i-check-circle", tone: "violet", spark: [4.1, 4.2, 4.2, 4.3, 4.3, 4.3, 4.2, 4.3, 4.3, 4.3, 4.3, 4.3], color: "#7c3aed" })
    ].join("");
    renderCustomersTable();
  }

  function badge(status) {
    return `<span class="badge ${esc(status)}">${esc(status.charAt(0).toUpperCase() + status.slice(1))}</span>`;
  }

  function paginate(rows, page, per) {
    const pages = Math.max(Math.ceil(rows.length / per), 1);
    const p = Math.min(page, pages);
    return { rows: rows.slice((p - 1) * per, p * per), pages, page: p };
  }

  function pagerHTML(pages, page, target) {
    if (pages <= 1) return "";
    let out = `<button data-page="${page - 1}" data-target="${target}" ${page === 1 ? "disabled" : ""} aria-label="Previous page">${icon("i-chevron-left")}</button>`;
    for (let i = 1; i <= pages; i++) {
      if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - page) > 1) {
        if (i === 3) out += `<button disabled>…</button>`;
        continue;
      }
      out += `<button data-page="${i}" data-target="${target}" class="${i === page ? "active" : ""}">${i}</button>`;
    }
    out += `<button data-page="${page + 1}" data-target="${target}" ${page === pages ? "disabled" : ""} aria-label="Next page">${icon("i-chevron-right")}</button>`;
    return out;
  }

  function renderCustomersTable() {
    const q = S.search.customers.toLowerCase();
    const f = S.filter.customers;
    let rows = D.customers.filter(
      (c) =>
        (f === "all" || c.status === f) &&
        (!q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.city.toLowerCase().includes(q))
    );
    const { key, dir } = S.sort.customers;
    rows.sort((a, b) => {
      const av = key === "events" ? a.events : a.spend;
      const bv = key === "events" ? b.events : b.spend;
      return (av - bv) * dir;
    });
    const pg = paginate(rows, S.page.customers, S.perPage);
    S.page.customers = pg.page;

    const tbody = $("#customersTable tbody");
    if (!pg.rows.length) {
      tbody.innerHTML = `<tr><td colspan="6">${emptyState("No customers match that filter", "Try a different search or clear the status chip.")}</td></tr>`;
    } else {
      tbody.innerHTML = pg.rows
        .map(
          (c) => `<tr>
          <td><div class="cell-customer"><span class="avatar">${initials(c.name)}</span>
            <div><b>${esc(c.name)}</b><small>${esc(c.phone)} · ${esc(c.city)}</small></div></div></td>
          <td>${c.events}</td>
          <td class="cell-amount">${inr(c.spend)}</td>
          <td>${c.lastBooking ? esc(fmtDate(c.lastBooking)) : "—"}</td>
          <td>${badge(c.status)}</td>
          <td><div class="row-actions">
            <button class="row-btn" data-open-customer="${esc(c.id)}" aria-label="View ${esc(c.name)}">${icon("i-eye")}</button>
            <button class="row-btn" data-edit-customer="${esc(c.id)}" aria-label="Edit ${esc(c.name)}">${icon("i-edit")}</button>
            <button class="row-btn danger" data-delete-customer="${esc(c.id)}" aria-label="Delete ${esc(c.name)}">${icon("i-trash")}</button>
          </div></td></tr>`
        )
        .join("");
    }
    $("#customersCount").textContent = `${rows.length} customer${rows.length === 1 ? "" : "s"} · showing ${pg.rows.length}`;
    $("#customersPager").innerHTML = pagerHTML(pg.pages, pg.page, "customers");
    $("#customersSort").innerHTML = `${icon("i-sort")}Sort by ${S.sort.customers.key === "spend" ? "events" : "spend"}`;
  }

  function renderBookings() {
    $("#bookingKpis").innerHTML = [
      kpiCard({ label: "Confirmed", value: D.bookings.filter((b) => b.status === "confirmed").length, sub: "upcoming events", ic: "i-check-circle", tone: "green", spark: [3, 4, 5, 4, 6, 7, 6, 8, 7, 9, 8, 10], color: "#10b981" }),
      kpiCard({ label: "Pending", value: pendingCount(), sub: "awaiting confirmation", ic: "i-clock", tone: "amber", spark: [5, 4, 6, 5, 7, 6, 5, 4, 6, 5, 4, pendingCount()], color: "#f59e0b" }),
      kpiCard({ label: "Completed", value: D.bookings.filter((b) => b.status === "completed").length, sub: "this year", ic: "i-box", spark: [8, 9, 7, 10, 9, 11, 10, 12, 11, 13, 12, 14] }),
      kpiCard({ label: "Cancelled", value: D.bookings.filter((b) => b.status === "cancelled").length, sub: "released dates", ic: "i-x", tone: "violet", spark: [1, 2, 1, 2, 1, 2, 2, 1, 2, 1, 2, 2], color: "#7c3aed" })
    ].join("");
    renderBookingsTable();
  }

  function renderBookingsTable() {
    const q = S.search.bookings.toLowerCase();
    const f = S.filter.bookings;
    let rows = D.bookings.filter(
      (b) =>
        (f === "all" || b.status === f) &&
        (!q ||
          b.id.toLowerCase().includes(q) ||
          b.customer.toLowerCase().includes(q) ||
          b.occasion.toLowerCase().includes(q))
    );
    const { key, dir } = S.sort.bookings;
    rows.sort((a, b) => {
      let av, bv;
      if (key === "amount") { av = a.amount; bv = b.amount; }
      else if (key === "customer") { av = a.customer; bv = b.customer; }
      else if (key === "id") { av = a.id; bv = b.id; }
      else { av = a.date; bv = b.date; }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    const pg = paginate(rows, S.page.bookings, S.perPage);
    S.page.bookings = pg.page;

    const tbody = $("#bookingsTable tbody");
    if (!pg.rows.length) {
      tbody.innerHTML = `<tr><td colspan="8">${emptyState("No bookings found", "Nothing matches that search or status.")}</td></tr>`;
    } else {
      tbody.innerHTML = pg.rows
        .map(
          (b) => `<tr>
          <td><span class="cell-id">${esc(b.id)}</span></td>
          <td><div class="cell-customer"><span class="avatar">${initials(b.customer)}</span>
            <div><b>${esc(b.customer)}</b><small>${esc(b.session.split(" ")[0])} · ${esc(b.hall)}</small></div></div></td>
          <td>${esc(fmtDate(b.date))}</td>
          <td>${esc(b.occasion)}</td>
          <td>${b.guests.toLocaleString("en-IN")}</td>
          <td class="cell-amount">${inr(b.amount)}</td>
          <td>${badge(b.status)}</td>
          <td><div class="row-actions">
            <button class="row-btn" data-open-booking="${esc(b.id)}" aria-label="View ${esc(b.id)}">${icon("i-eye")}</button>
            <button class="row-btn" data-edit-booking="${esc(b.id)}" aria-label="Edit ${esc(b.id)}">${icon("i-edit")}</button>
            <button class="row-btn danger" data-delete-booking="${esc(b.id)}" aria-label="Delete ${esc(b.id)}">${icon("i-trash")}</button>
          </div></td></tr>`
        )
        .join("");
    }
    $("#bookingsCount").textContent = `${rows.length} booking${rows.length === 1 ? "" : "s"} · showing ${pg.rows.length}`;
    $("#bookingsPager").innerHTML = pagerHTML(pg.pages, pg.page, "bookings");
    $$("#bookingsTable th.sortable").forEach((th) => {
      th.classList.toggle("sorted", th.dataset.sort === key);
      const ic = th.querySelector(".sort-ic");
      if (ic) ic.style.transform = th.dataset.sort === key && dir === 1 ? "rotate(180deg)" : "";
    });
  }

  function renderInvoices() {
    const paid = D.invoices.filter((i) => i.status === "paid");
    const open = D.invoices.filter((i) => i.status !== "paid");
    $("#invoiceKpis").innerHTML = [
      kpiCard({ label: "Paid", value: inrCompact(paid.reduce((s, i) => s + i.amount, 0)), trend: `${paid.length} invoices`, sub: "settled", ic: "i-check-circle", tone: "green", spark: [4, 6, 5, 7, 8, 7, 9, 8, 10, 9, 11, 12], color: "#10b981" }),
      kpiCard({ label: "Awaiting payment", value: inrCompact(open.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0)), trend: `${open.filter((i) => i.status === "pending").length} pending`, dir: "neutral", sub: "advances due", ic: "i-clock", tone: "amber", spark: [3, 4, 3, 5, 4, 6, 5, 4, 6, 5, 4, 5], color: "#f59e0b" }),
      kpiCard({ label: "Overdue", value: inrCompact(open.filter((i) => i.status === "failed").reduce((s, i) => s + i.amount, 0)), trend: `${open.filter((i) => i.status === "failed").length} overdue`, dir: "down", sub: "needs follow-up", ic: "i-alert", tone: "violet", spark: [2, 3, 2, 3, 4, 3, 2, 3, 2, 3, 2, 2], color: "#7c3aed" }),
      kpiCard({ label: "Collection rate", value: Math.round((paid.reduce((s, i) => s + i.amount, 0) / Math.max(D.invoices.reduce((s, i) => s + i.amount, 0), 1)) * 100) + "%", trend: "+2.1%", sub: "of invoiced value", ic: "i-trend", spark: [62, 64, 63, 66, 68, 67, 70, 72, 71, 74, 76, 78] })
    ].join("");
    renderInvoicesTable();
  }

  function renderInvoicesTable() {
    const q = S.search.invoices.toLowerCase();
    const f = S.filter.invoices;
    let rows = D.invoices.filter(
      (i) => (f === "all" || i.status === f) && (!q || i.id.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q))
    );
    rows.sort((a, b) => (a.issued < b.issued ? 1 : -1));
    const pg = paginate(rows, S.page.invoices, S.perPage);
    S.page.invoices = pg.page;
    const tbody = $("#invoicesTable tbody");
    if (!pg.rows.length) {
      tbody.innerHTML = `<tr><td colspan="7">${emptyState("No invoices here", "Try another status filter or clear the search.")}</td></tr>`;
    } else {
      tbody.innerHTML = pg.rows
        .map(
          (i) => `<tr>
          <td><span class="cell-id">${esc(i.id)}</span></td>
          <td>${esc(i.customer)}</td>
          <td>${esc(fmtDateShort(i.issued))}</td>
          <td>${esc(fmtDateShort(i.due))}</td>
          <td class="cell-amount">${inr(i.amount)}</td>
          <td>${badge(i.status === "failed" ? "failed" : i.status)}</td>
          <td><div class="row-actions">
            <button class="row-btn" data-open-invoice="${esc(i.id)}" aria-label="View ${esc(i.id)}">${icon("i-eye")}</button>
            ${i.status !== "paid" ? `<button class="row-btn" data-mark-paid="${esc(i.id)}" aria-label="Mark ${esc(i.id)} paid">${icon("i-check")}</button>` : ""}
            <button class="row-btn" data-download-invoice="${esc(i.id)}" aria-label="Download ${esc(i.id)}">${icon("i-download")}</button>
          </div></td></tr>`
        )
        .join("");
    }
    $("#invoicesCount").textContent = `${rows.length} invoice${rows.length === 1 ? "" : "s"} · showing ${pg.rows.length}`;
    $("#invoicesPager").innerHTML = pagerHTML(pg.pages, pg.page, "invoices");
  }

  function emptyState(title, sub) {
    return `<div class="empty-state">
      <svg viewBox="0 0 120 90" fill="none" aria-hidden="true">
        <rect x="14" y="22" width="92" height="56" rx="8" fill="var(--surface-2)" stroke="var(--line-strong)" stroke-width="2"/>
        <rect x="26" y="36" width="46" height="5" rx="2.5" fill="var(--line-strong)"/>
        <rect x="26" y="48" width="34" height="5" rx="2.5" fill="var(--line)"/>
        <rect x="26" y="60" width="26" height="5" rx="2.5" fill="var(--line)"/>
        <circle cx="88" cy="54" r="15" fill="var(--blue-50)" stroke="var(--blue)" stroke-width="2"/>
        <path d="M82 54l4 4 7-8" stroke="var(--blue)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h4>${esc(title)}</h4><p>${esc(sub)}</p></div>`;
  }

  function renderReports() {
    const cards = [
      { title: "Bookings report", desc: "Every request with dates, guests and status", rows: D.bookings.length, type: "bookings" },
      { title: "Revenue report", desc: "Collected vs booked value by month", rows: 12, type: "revenue" },
      { title: "Customer ledger", desc: "Lifetime spend and event history", rows: D.customers.length, type: "customers" },
      { title: "Invoice register", desc: "Issued, due and payment status", rows: D.invoices.length, type: "invoices" }
    ];
    $("#reportCards").innerHTML = cards
      .map(
        (c) => `<section class="card">
        <div class="card-head">
          <div><h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p></div>
          <span class="badge progress">${c.rows} rows</span>
        </div>
        <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" data-action="export-csv" data-export="${c.type}">${icon("i-download")}CSV</button>
          <button class="btn btn-ghost btn-sm" data-action="print-report" data-export="${c.type}">${icon("i-file")}Print / PDF</button>
        </div>
      </section>`
      )
      .join("");

    const ms = months12();
    const occ = ms.map((m) => {
      const count = D.bookings.filter((b) => monthKey(parse(b.date)) === m.key && b.status !== "cancelled").length;
      return Math.min(Math.round((count / 6) * 100), 100);
    });
    barChart("occupancyWrap", "occupancyTip", {
      labels: ms.map((m) => m.label),
      data: occ,
      color: "#2563eb",
      suffix: "%",
      aria: "Occupancy by month"
    });
  }

  function renderAllCharts() {
    if (S.view === "overview") {
      const ms = months12();
      const bookingSeries = seriesFor("count");
      lineChart("growthChartWrap", "growthTip", {
        id: "growth",
        labels: ms.map((m) => m.label),
        series: [
          { name: "Bookings", data: bookingSeries, color: "#2563eb" },
          { name: "Enquiries", data: bookingSeries.map((v, i) => v + 4 + ((i * 3) % 6)), color: "#10b981" }
        ],
        animate: S.animate,
        aria: "Monthly bookings and enquiries"
      });
    } else if (S.view === "revenue") {
      const ms = months12();
      const amountSeries = seriesFor("amount");
      lineChart("revenueChartWrap", "revenueTip", {
        id: "rev",
        labels: ms.map((m) => m.label),
        series: [
          { name: "Collected", data: amountSeries.map((v) => Math.round(v * 0.72)), color: "#2563eb" },
          { name: "Booked", data: amountSeries, color: "#f59e0b" }
        ],
        money: true,
        animate: S.animate,
        aria: "Revenue collected versus booked"
      });
      const sessions = ["Morning (9 AM – 2 PM)", "Evening (4 PM – 9 PM)", "Full day"];
      barChart("sessionChartWrap", "sessionTip", {
        labels: ["Morning", "Evening", "Full day"],
        data: sessions.map((s) => active().filter((b) => b.session === s).reduce((sum, b) => sum + b.amount, 0)),
        color: ["#2563eb", "#0ea5e9", "#7c3aed"],
        money: true,
        aria: "Revenue by session"
      });
    } else if (S.view === "reports") {
      renderReports();
    }
  }

  /* ═════════ view switching ═════════ */
  function setView(view) {
    if (!VIEW_META[view]) return;
    S.view = view;
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
    $$(".nav-item[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    const meta = VIEW_META[view];
    $("#topbarTitle").textContent = meta[0];
    $("#topbarSub").textContent = meta[1];
    document.title = meta[0] + " — Arjuna Celebrations Hall";
    history.replaceState(null, "", "#" + view);
    document.body.classList.remove("sidebar-open");
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

    if (view === "overview") renderOverview();
    else if (view === "revenue") renderRevenue();
    else if (view === "users") renderCustomers();
    else if (view === "orders") renderBookings();
    else if (view === "invoices") renderInvoices();
    else if (view === "reports") { renderReports(); renderAllCharts(); }
    else if (view === "settings") syncSettingsUI();
    applyRole();
  }

  /* ═════════ role-based access control ═════════ */
  const ROLE_RULES = {
    admin: { views: null, canWrite: true, label: "Super Admin" },
    editor: { views: ["overview", "revenue", "users", "orders", "invoices", "reports"], canWrite: true, label: "Manager" },
    viewer: { views: ["overview", "revenue", "orders"], canWrite: false, label: "Staff" }
  };

  function applyRole() {
    const rule = ROLE_RULES[S.role] || ROLE_RULES.admin;
    $$(".nav-item[data-view]").forEach((b) => {
      const allowed = !rule.views || rule.views.includes(b.dataset.view);
      b.hidden = !allowed;
    });
    document.body.classList.toggle("read-only", !rule.canWrite);
    $$('[data-action="new-booking"], [data-action="new-invoice"], [data-action="add-customer"], [data-action="delete"], .danger-zone #resetDataBtn').forEach((b) => {
      b.hidden = !rule.canWrite;
    });
    $$("[data-edit-booking], [data-delete-booking], [data-edit-customer], [data-delete-customer]").forEach((b) => {
      b.hidden = !rule.canWrite;
    });
    if (rule.views && !rule.views.includes(S.view)) setView(rule.views[0]);
  }

  /* ═════════ drawer / modal ═════════ */
  let scrimUse = 0;
  function openDrawer(title, sub, body, foot) {
    $("#drawerTitle").textContent = title;
    $("#drawerSub").textContent = sub || "";
    $("#drawerBody").innerHTML = body;
    $("#drawerFoot").innerHTML = foot || "";
    $("#drawer").hidden = false;
    scrimUse++;
    $("#scrim").classList.add("open");
    requestAnimationFrame(() => $("#drawer").classList.add("open"));
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    $("#drawer").classList.remove("open");
    scrimUse = Math.max(scrimUse - 1, 0);
    if (!scrimUse) $("#scrim").classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { if (!$("#drawer").classList.contains("open")) $("#drawer").hidden = true; }, 300);
  }
  function openModal(title, sub, body, foot) {
    $("#modalTitle").textContent = title;
    $("#modalSub").textContent = sub || "";
    $("#modalBody").innerHTML = body;
    $("#modalFoot").innerHTML = foot || "";
    $("#modal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#modal").classList.remove("open");
    document.body.style.overflow = "";
  }

  function openBooking(id) {
    const b = D.bookings.find((x) => x.id === id);
    if (!b) return;
    const inv = D.invoices.find((i) => i.bookingId === b.id);
    const body = `
      <div class="drawer-section">
        <h4>Summary</h4>
        <dl class="detail-list">
          <div><dt>Status</dt><dd>${badge(b.status)}</dd></div>
          <div><dt>Event date</dt><dd>${esc(fmtDate(b.date))}</dd></div>
          <div><dt>Session</dt><dd>${esc(b.session)}</dd></div>
          <div><dt>Hall</dt><dd>${esc(b.hall)}</dd></div>
          <div><dt>Occasion</dt><dd>${esc(b.occasion)}</dd></div>
          <div><dt>Guests</dt><dd>${b.guests.toLocaleString("en-IN")}</dd></div>
          <div><dt>Package</dt><dd>${esc(b.package)}</dd></div>
          <div><dt>Amount</dt><dd>${inr(b.amount)}</dd></div>
          <div><dt>Booked on</dt><dd>${esc(fmtDate(b.created))}</dd></div>
          ${inv ? `<div><dt>Invoice</dt><dd>${esc(inv.id)} · ${esc(inv.status)}</dd></div>` : ""}
        </dl>
      </div>
      <div class="drawer-section">
        <h4>Customer</h4>
        <div class="mini-row" style="border:0">
          <span class="avatar" style="width:38px;height:38px">${initials(b.customer)}</span>
          <div class="grow"><b>${esc(b.customer)}</b><small>${esc(b.phone)} · ${esc(b.email)}</small></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <a class="btn btn-ghost btn-sm" href="tel:${b.phone.replace(/\s/g, "")}">${icon("i-phone")}Call</a>
          <a class="btn btn-ghost btn-sm" href="mailto:${esc(b.email)}">${icon("i-mail")}Email</a>
          <button class="btn btn-ghost btn-sm" data-copy="${esc(b.id)}">${icon("i-file")}Copy ID</button>
        </div>
      </div>
      ${b.notes ? `<div class="drawer-section"><h4>Notes</h4><p style="font-size:.86rem;color:var(--muted)">${esc(b.notes)}</p></div>` : ""}
    `;
    const foot = ROLE_RULES[S.role].canWrite
      ? `${b.status === "pending" ? `<button class="btn btn-primary" data-confirm-booking="${esc(b.id)}">${icon("i-check")}Confirm</button>` : ""}
         <button class="btn btn-ghost" data-edit-booking="${esc(b.id)}">${icon("i-edit")}Edit</button>
         <button class="btn btn-danger" data-delete-booking="${esc(b.id)}">${icon("i-trash")}Delete</button>`
      : `<button class="btn btn-ghost" data-close-drawer>Close</button>`;
    openDrawer("Booking " + b.id, b.customer + " · " + b.occasion, body, foot);
  }

  function openCustomer(id) {
    const c = D.customers.find((x) => x.id === id);
    if (!c) return;
    const list = D.bookings.filter((b) => b.customerId === c.id);
    const body = `
      <div class="drawer-section">
        <div class="mini-row" style="border:0">
          <span class="avatar" style="width:44px;height:44px;font-size:.95rem">${initials(c.name)}</span>
          <div class="grow"><b style="font-size:.98rem">${esc(c.name)}</b>
            <small>${esc(c.type)} · ${esc(c.city)}</small></div>
        </div>
        <dl class="detail-list" style="margin-top:12px">
          <div><dt>Customer ID</dt><dd>${esc(c.id)}</dd></div>
          <div><dt>Phone</dt><dd>${esc(c.phone)}</dd></div>
          <div><dt>Email</dt><dd>${esc(c.email)}</dd></div>
          <div><dt>Events booked</dt><dd>${c.events}</dd></div>
          <div><dt>Lifetime spend</dt><dd>${inr(c.spend)}</dd></div>
          <div><dt>Last booking</dt><dd>${c.lastBooking ? esc(fmtDate(c.lastBooking)) : "—"}</dd></div>
          <div><dt>Status</dt><dd>${badge(c.status)}</dd></div>
        </dl>
      </div>
      <div class="drawer-section">
        <h4>Booking history (${list.length})</h4>
        <div class="mini-list">
          ${list.length
            ? list
                .map(
                  (b) => `<div class="mini-row"><span class="mini-ic">${icon("i-calendar")}</span>
                  <div class="grow"><b>${esc(b.occasion)}</b><small>${esc(fmtDate(b.date))} · ${esc(b.hall)}</small></div>
                  <span class="val">${inrCompact(b.amount)}</span></div>`
                )
                .join("")
            : `<p class="f-hint">No bookings yet — this customer only has an enquiry.</p>`}
        </div>
      </div>`;
    const foot = `<button class="btn btn-ghost" data-edit-customer="${esc(c.id)}">${icon("i-edit")}Edit</button>
      <button class="btn btn-primary" data-action="new-booking" data-customer="${esc(c.id)}">${icon("i-plus")}New booking</button>`;
    openDrawer(c.name, c.type + " customer · " + c.id, body, foot);
  }

  function openInvoice(id) {
    const i = D.invoices.find((x) => x.id === id);
    if (!i) return;
    const b = D.bookings.find((x) => x.id === i.bookingId);
    const body = `
      <div class="drawer-section">
        <h4>Invoice</h4>
        <dl class="detail-list">
          <div><dt>Invoice no.</dt><dd>${esc(i.id)}</dd></div>
          <div><dt>Issued</dt><dd>${esc(fmtDate(i.issued))}</dd></div>
          <div><dt>Due</dt><dd>${esc(fmtDate(i.due))}</dd></div>
          <div><dt>Amount due</dt><dd>${inr(i.amount)}</dd></div>
          <div><dt>Booking total</dt><dd>${inr(i.total)}</dd></div>
          <div><dt>Status</dt><dd>${badge(i.status)}</dd></div>
        </dl>
      </div>
      <div class="drawer-section">
        <h4>Billed to</h4>
        <p style="font-size:.88rem"><b>${esc(i.customer)}</b><br>Mata Mandir Main Rd, Khamla, Nagpur 440025<br>GSTIN 27AABCA1234F1Z5</p>
      </div>
      ${b ? `<div class="drawer-section"><h4>Event</h4><p style="font-size:.86rem;color:var(--muted)">${esc(b.occasion)} · ${esc(fmtDate(b.date))} · ${esc(b.session)} · ${b.guests} guests</p></div>` : ""}`;
    const foot = `${i.status !== "paid" ? `<button class="btn btn-primary" data-mark-paid="${esc(i.id)}">${icon("i-check")}Mark paid</button>` : ""}
      <button class="btn btn-ghost" data-download-invoice="${esc(i.id)}">${icon("i-download")}Download PDF</button>`;
    openDrawer("Invoice " + i.id, i.customer, body, foot);
  }

  /* ═════════ CRUD forms ═════════ */
  function bookingForm(b) {
    const isEdit = !!b;
    const v = b || { customer: "", phone: "", email: "", date: iso(new Date(TODAY.getTime() + 30 * 86400000)), occasion: "Wedding", guests: 300, amount: 250000, session: "Evening (4 PM – 9 PM)", package: "Venue + Catering", hall: "Hall A", status: "pending" };
    return `
      <div class="form-grid">
        <div class="form-row">
          <div class="f-field"><label for="fCustomer">Customer name</label><input id="fCustomer" value="${esc(v.customer)}" placeholder="Full name" /></div>
          <div class="f-field"><label for="fPhone">Phone</label><input id="fPhone" value="${esc(v.phone)}" placeholder="+91 98765 43210" /></div>
        </div>
        <div class="f-field"><label for="fEmail">Email</label><input type="email" id="fEmail" value="${esc(v.email)}" placeholder="name@email.com" /></div>
        <div class="form-row">
          <div class="f-field"><label for="fDate">Event date</label><input type="date" id="fDate" value="${esc(v.date)}" /></div>
          <div class="f-field"><label for="fGuests">Guests</label><input type="number" id="fGuests" min="50" max="1000" value="${v.guests}" /></div>
        </div>
        <div class="form-row">
          <div class="f-field"><label for="fOccasion">Occasion</label><select id="fOccasion">${["Wedding", "Reception", "Engagement", "Sangeet", "Haldi / Mehndi", "Corporate event", "Birthday / Anniversary"].map((o) => `<option ${o === v.occasion ? "selected" : ""}>${o}</option>`).join("")}</select></div>
          <div class="f-field"><label for="fSession">Session</label><select id="fSession">${["Morning (9 AM – 2 PM)", "Evening (4 PM – 9 PM)", "Full day"].map((o) => `<option ${o === v.session ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        </div>
        <div class="form-row">
          <div class="f-field"><label for="fPackage">Package</label><select id="fPackage">${["The Venue", "Venue + Catering", "Full Celebration"].map((o) => `<option ${o === v.package ? "selected" : ""}>${o}</option>`).join("")}</select></div>
          <div class="f-field"><label for="fHall">Hall</label><select id="fHall">${["Hall A", "Hall B", "Both halls"].map((o) => `<option ${o === v.hall ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        </div>
        <div class="form-row">
          <div class="f-field"><label for="fAmount">Amount (₹)</label><input type="number" id="fAmount" min="0" step="500" value="${v.amount}" /></div>
          <div class="f-field"><label for="fStatus">Status</label><select id="fStatus">${["pending", "confirmed", "completed", "cancelled"].map((o) => `<option ${o === v.status ? "selected" : ""} value="${o}">${o[0].toUpperCase() + o.slice(1)}</option>`).join("")}</select></div>
        </div>
      </div>`;
  }

  function openBookingModal(id) {
    if (!ROLE_RULES[S.role].canWrite) return toast("Read-only role", "Staff accounts can't edit bookings.", "error");
    const b = id ? D.bookings.find((x) => x.id === id) : null;
    openModal(
      b ? "Edit booking " + b.id : "New booking",
      b ? "Update the details and save." : "Add an event manually — the customer is created if new.",
      bookingForm(b),
      `<button class="btn btn-ghost" data-close-modal>Cancel</button><button class="btn btn-primary" id="saveBooking">${icon("i-check")}${b ? "Save changes" : "Create booking"}</button>`
    );
    $("#saveBooking").addEventListener("click", () => {
      const customer = $("#fCustomer").value.trim();
      const phone = $("#fPhone").value.trim();
      const email = $("#fEmail").value.trim();
      const date = $("#fDate").value;
      const guests = parseInt($("#fGuests").value, 10);
      const amount = parseInt($("#fAmount").value, 10);
      if (!customer || !phone || !date || !(guests >= 50 && guests <= 1000) || !(amount > 0)) {
        return toast("Check the form", "Name, phone, a valid date, 50–1000 guests and an amount are required.", "error");
      }
      const payload = {
        customer, phone, email,
        date, guests, amount,
        occasion: $("#fOccasion").value,
        session: $("#fSession").value,
        package: $("#fPackage").value,
        hall: $("#fHall").value,
        status: $("#fStatus").value
      };
      if (b) {
        Object.assign(b, payload);
        toast("Booking updated", `${b.id} saved.`);
        logActivity("i-edit", `<b>${esc(S.user.name.split(" ")[0])}</b> updated booking <b>${esc(b.id)}</b>`);
      } else {
        let cust = D.customers.find((c) => c.name.toLowerCase() === customer.toLowerCase() || c.phone === phone);
        if (!cust) {
          cust = { id: "CU-" + String(1024 + D.customers.length), name: customer, type: "Family", phone, email, city: "Nagpur", events: 0, spend: 0, lastBooking: date, status: "confirmed" };
          D.customers.unshift(cust);
        }
        const nb = { id: "BK-" + (1041 + D.bookings.length), customerId: cust.id, ...payload, created: iso(TODAY) };
        D.bookings.unshift(nb);
        cust.events++;
        cust.spend += amount;
        cust.lastBooking = date;
        toast("Booking created", `${nb.id} for ${customer}.`);
        logActivity("i-plus", `<b>${esc(S.user.name.split(" ")[0])}</b> created booking <b>${esc(nb.id)}</b>`);
      }
      closeModal();
      closeDrawer();
      setView(S.view === "overview" ? "overview" : S.view);
    });
  }

  function openCustomerModal(id) {
    if (!ROLE_RULES[S.role].canWrite) return toast("Read-only role", "Staff accounts can't edit customers.", "error");
    const c = id ? D.customers.find((x) => x.id === id) : null;
    const v = c || { name: "", phone: "", email: "", city: "Nagpur", type: "Family" };
    openModal(
      c ? "Edit customer" : "Add customer",
      c ? c.id : "Manually add someone who enquired offline.",
      `<div class="form-grid">
        <div class="f-field"><label for="cName">Full name</label><input id="cName" value="${esc(v.name)}" /></div>
        <div class="form-row">
          <div class="f-field"><label for="cPhone">Phone</label><input id="cPhone" value="${esc(v.phone)}" /></div>
          <div class="f-field"><label for="cEmail">Email</label><input type="email" id="cEmail" value="${esc(v.email)}" /></div>
        </div>
        <div class="form-row">
          <div class="f-field"><label for="cCity">City</label><input id="cCity" value="${esc(v.city)}" /></div>
          <div class="f-field"><label for="cType">Type</label><select id="cType">${["Family", "Corporate"].map((t) => `<option ${t === v.type ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        </div>
      </div>`,
      `<button class="btn btn-ghost" data-close-modal>Cancel</button><button class="btn btn-primary" id="saveCustomer">${icon("i-check")}${c ? "Save changes" : "Add customer"}</button>`
    );
    $("#saveCustomer").addEventListener("click", () => {
      const name = $("#cName").value.trim();
      const phone = $("#cPhone").value.trim();
      if (!name || !phone) return toast("Check the form", "Name and phone are required.", "error");
      if (c) {
        Object.assign(c, { name, phone, email: $("#cEmail").value.trim(), city: $("#cCity").value.trim(), type: $("#cType").value });
        toast("Customer updated", name + " saved.");
      } else {
        D.customers.unshift({ id: "CU-" + String(1024 + D.customers.length), name, phone, email: $("#cEmail").value.trim(), city: $("#cCity").value.trim(), type: $("#cType").value, events: 0, spend: 0, lastBooking: null, status: "pending" });
        toast("Customer added", name + " is now in the list.");
      }
      logActivity("i-user", `<b>${esc(S.user.name.split(" ")[0])}</b> saved customer <b>${esc(name)}</b>`);
      closeModal();
      closeDrawer();
      setView("users");
    });
  }

  function openInvoiceModal() {
    if (!ROLE_RULES[S.role].canWrite) return toast("Read-only role", "Staff accounts can't create invoices.", "error");
    const opts = D.bookings
      .filter((b) => b.status !== "cancelled")
      .slice(0, 20)
      .map((b) => `<option value="${esc(b.id)}">${esc(b.id)} — ${esc(b.customer)} (${inr(b.amount)})</option>`)
      .join("");
    openModal(
      "Create invoice",
      "Issue an advance invoice against a confirmed booking.",
      `<div class="form-grid">
        <div class="f-field"><label for="iBooking">Booking</label><select id="iBooking">${opts}</select></div>
        <div class="form-row">
          <div class="f-field"><label for="iAmount">Amount (₹)</label><input type="number" id="iAmount" step="500" min="500" value="50000" /></div>
          <div class="f-field"><label for="iDue">Due date</label><input type="date" id="iDue" value="${iso(new Date(TODAY.getTime() + 14 * 86400000))}" /></div>
        </div>
        <div class="f-field"><label for="iStatus">Status</label><select id="iStatus"><option value="pending">Pending</option><option value="paid">Paid</option></select></div>
      </div>`,
      `<button class="btn btn-ghost" data-close-modal>Cancel</button><button class="btn btn-primary" id="saveInvoice">${icon("i-check")}Create invoice</button>`
    );
    $("#saveInvoice").addEventListener("click", () => {
      const b = D.bookings.find((x) => x.id === $("#iBooking").value);
      const amount = parseInt($("#iAmount").value, 10);
      if (!b || !(amount > 0)) return toast("Check the form", "Pick a booking and enter an amount.", "error");
      const inv = {
        id: "INV-" + TODAY.getFullYear() + "-" + String(D.invoices.length + 1).padStart(3, "0"),
        bookingId: b.id,
        customer: b.customer,
        customerId: b.customerId,
        issued: iso(TODAY),
        due: $("#iDue").value,
        amount,
        total: b.amount,
        status: $("#iStatus").value
      };
      D.invoices.unshift(inv);
      toast("Invoice created", `${inv.id} for ${b.customer}.`);
      logActivity("i-invoice", `<b>${esc(S.user.name.split(" ")[0])}</b> created invoice <b>${esc(inv.id)}</b>`);
      closeModal();
      setView("invoices");
    });
  }

  function confirmDelete(type, id) {
    if (!ROLE_RULES[S.role].canWrite) return toast("Read-only role", "Staff accounts can't delete records.", "error");
    const label = type === "booking" ? "booking" : "customer";
    openModal(
      "Delete " + label,
      "This can't be undone.",
      `<p style="font-size:.9rem;color:var(--ink-2)">Are you sure you want to delete <b>${esc(id)}</b>? ${
        type === "customer" ? "Their booking history will stay in the bookings table." : "Any linked invoice will also be removed."
      }</p>`,
      `<button class="btn btn-ghost" data-close-modal>Keep it</button><button class="btn btn-danger" id="doDelete">${icon("i-trash")}Delete</button>`
    );
    $("#doDelete").addEventListener("click", () => {
      if (type === "booking") {
        const idx = D.bookings.findIndex((b) => b.id === id);
        if (idx > -1) D.bookings.splice(idx, 1);
        D.invoices = D.invoices.filter((i) => i.bookingId !== id);
      } else {
        const idx = D.customers.findIndex((c) => c.id === id);
        if (idx > -1) D.customers.splice(idx, 1);
      }
      toast(label[0].toUpperCase() + label.slice(1) + " deleted", id + " removed.");
      logActivity("i-trash", `<b>${esc(S.user.name.split(" ")[0])}</b> deleted ${label} <b>${esc(id)}</b>`);
      closeModal();
      closeDrawer();
      setView(S.view);
    });
  }

  function logActivity(ic, text) {
    D.activity.unshift({ ic, text, time: "Just now" });
    if (S.view === "overview") {
      $("#activityFeed").innerHTML = D.activity
        .slice(0, 5)
        .map((a) => `<div class="activity-item"><span class="act-ic">${icon(a.ic)}</span><div><p>${a.text}</p><small>${esc(a.time)}</small></div></div>`)
        .join("");
    }
  }

  /* ═════════ export ═════════ */
  function csvEscape(v) {
    const s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function download(filename, content) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
  function exportCSV(type) {
    let rows = [];
    let name = type;
    if (type === "bookings") {
      rows = [["ID", "Customer", "Date", "Occasion", "Guests", "Package", "Session", "Hall", "Amount", "Status"]].concat(
        D.bookings.map((b) => [b.id, b.customer, b.date, b.occasion, b.guests, b.package, b.session, b.hall, b.amount, b.status])
      );
    } else if (type === "revenue") {
      const ms = months12();
      rows = [["Month", "Booked value"]].concat(ms.map((m) => [`${m.label} ${TODAY.getFullYear()}`, seriesFor("amount")[ms.indexOf(m)]]));
    } else if (type === "customers") {
      rows = [["ID", "Name", "Type", "Phone", "Email", "City", "Events", "Spend", "Last booking", "Status"]].concat(
        D.customers.map((c) => [c.id, c.name, c.type, c.phone, c.email, c.city, c.events, c.spend, c.lastBooking || "", c.status])
      );
    } else if (type === "invoices") {
      rows = [["Invoice", "Booking", "Customer", "Issued", "Due", "Amount", "Status"]].concat(
        D.invoices.map((i) => [i.id, i.bookingId, i.customer, i.issued, i.due, i.amount, i.status])
      );
    }
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
    const stamp = iso(TODAY);
    download(`arjuna-${name}-${stamp}.csv`, "\uFEFF" + csv);
    toast("Export ready", `${name} report downloaded as CSV.`, "info");
    logActivity("i-download", `<b>${esc(S.user.name.split(" ")[0])}</b> exported the ${name} report`);
  }

  function downloadInvoice(id) {
    const i = D.invoices.find((x) => x.id === id);
    if (!i) return;
    const lines = [
      "ARJUNA CELEBRATIONS HALL",
      "Mata Mandir Main Rd, Pande Layout, Khamla, Nagpur 440025",
      "Phone: 096899 02501 · GSTIN 27AABCA1234F1Z5",
      "",
      `Invoice: ${i.id}`,
      `Customer: ${i.customer}`,
      `Issued: ${fmtDate(i.issued)}    Due: ${fmtDate(i.due)}`,
      `Booking: ${i.bookingId}`,
      "",
      `Amount: ${inr(i.amount)}`,
      `Booking total: ${inr(i.total)}`,
      `Status: ${i.status.toUpperCase()}`,
      "",
      "Thank you — we look forward to hosting you."
    ];
    download(`${i.id}.txt`, lines.join("\n"));
    toast("Invoice downloaded", `${i.id} saved to your device.`, "info");
  }

  /* ═════════ notifications ═════════ */
  function renderNotifications() {
    const list = $("#notifList");
    const unread = D.notifications.filter((n) => n.unread).length;
    $("#notifCount").textContent = unread;
    $("#notifCount").hidden = unread === 0;
    if (!D.notifications.length) {
      list.innerHTML = `<p class="notif-empty">You're all caught up.</p>`;
      return;
    }
    list.innerHTML = D.notifications
      .map(
        (n) => `<button class="notif ${n.unread ? "unread" : ""}" data-notif="${n.id}">
        <span class="notif-ic ${n.tone}">${icon(n.ic)}</span>
        <span><p><b>${esc(n.title)}</b><br>${esc(n.body)}</p><small>${esc(n.time)}</small></span>
      </button>`
      )
      .join("");
  }

  /* ═════════ search ═════════ */
  const SEARCH_INDEX = [
    { label: "Overview", hint: "Page", view: "overview", ic: "i-grid" },
    { label: "Sales & revenue", hint: "Page", view: "revenue", ic: "i-chart" },
    { label: "Customers", hint: "Page", view: "users", ic: "i-users" },
    { label: "Bookings", hint: "Page", view: "orders", ic: "i-box" },
    { label: "Invoices & billing", hint: "Page", view: "invoices", ic: "i-invoice" },
    { label: "Reports & export", hint: "Page", view: "reports", ic: "i-report" },
    { label: "System settings", hint: "Page", view: "settings", ic: "i-settings" },
    { label: "New booking", hint: "Action", action: "new-booking", ic: "i-plus" },
    { label: "Create invoice", hint: "Action", action: "new-invoice", ic: "i-invoice" },
    { label: "Export report", hint: "Action", action: "export-report", ic: "i-download" }
  ];

  function renderSearch(q) {
    const pop = $("#searchPop");
    const query = q.trim().toLowerCase();
    if (!query) { pop.hidden = true; return; }
    const pages = SEARCH_INDEX.filter((i) => i.label.toLowerCase().includes(query));
    const bookings = D.bookings.filter((b) => b.id.toLowerCase().includes(query) || b.customer.toLowerCase().includes(query)).slice(0, 4);
    const customers = D.customers.filter((c) => c.name.toLowerCase().includes(query)).slice(0, 3);
    let html = "";
    if (pages.length) {
      html += `<p class="sp-label">Pages &amp; actions</p>`;
      html += pages.map((p) => `<button data-search-view="${p.view || ""}" data-search-action="${p.action || ""}">${icon(p.ic)}${esc(p.label)}<small>${p.hint}</small></button>`).join("");
    }
    if (bookings.length) {
      html += `<p class="sp-label">Bookings</p>` + bookings.map((b) => `<button data-search-booking="${esc(b.id)}">${icon("i-box")}${esc(b.customer)} <small>${esc(b.id)}</small></button>`).join("");
    }
    if (customers.length) {
      html += `<p class="sp-label">Customers</p>` + customers.map((c) => `<button data-search-customer="${esc(c.id)}">${icon("i-user")}${esc(c.name)} <small>${esc(c.phone)}</small></button>`).join("");
    }
    pop.innerHTML = html || `<p class="sp-empty">No matches for “${esc(q.trim())}”. Try a booking ID like BK-1045.</p>`;
    pop.hidden = false;
  }

  /* ═════════ settings sync ═════════ */
  function syncSettingsUI() {
    $("#setFirstName").value = S.user.name.split(" ")[0] || "";
    $("#setLastName").value = S.user.name.split(" ").slice(1).join(" ") || "";
    $("#setEmail").value = S.user.email;
    $$('input[name="themeChoice"]').forEach((r) => { r.checked = r.value === S.theme; });
    $("#miniSidebar").checked = S.mini;
    $("#showSparks").checked = S.sparks;
    $("#compactRows").checked = S.compact;
    $("#animateCharts").checked = S.animate;
    renderTeam();
    setTab(S.tab);
  }

  function setTab(tab) {
    S.tab = tab;
    $$(".tab").forEach((t) => {
      const on = t.dataset.tab === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", String(on));
    });
    $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
  }

  function renderTeam() {
    const team = [
      { name: "Adil Sayyad", email: "admin@arjunahall.in", role: "Super Admin", badge: "active" },
      { name: "Sneha Kulkarni", email: "sneha@arjunahall.in", role: "Manager", badge: "active" },
      { name: "Vikas Meshram", email: "vikas@arjunahall.in", role: "Staff", badge: "active" },
      { name: "Pooja Inamdar", email: "pooja@arjunahall.in", role: "Staff", badge: "pending" }
    ];
    $("#teamList").innerHTML = team
      .map(
        (t) => `<div class="mini-row"><span class="avatar">${initials(t.name)}</span>
        <div class="grow"><b>${esc(t.name)}</b><small>${esc(t.email)} · ${esc(t.role)}</small></div>
        ${badge(t.badge === "active" ? "active" : "pending")}</div>`
      )
      .join("");
  }

  /* ═════════ login ═════════ */
  function showApp(remember) {
    $("#loginGate").hidden = true;
    $("#app").hidden = false;
    $("#fabWrap").hidden = false;
    if (remember) localStorage.setItem("arjuna:authed", "1");
    const hash = location.hash.replace("#", "");
    setView(VIEW_META[hash] ? hash : "overview");
    applyTheme(localStorage.getItem("arjuna:theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), false);
    applyMini(localStorage.getItem("arjuna:mini") === "true");
  }

  function logout() {
    localStorage.removeItem("arjuna:authed");
    openModal(
      "Log out?",
      "You'll need to sign in again to see bookings.",
      `<p style="font-size:.9rem;color:var(--ink-2)">Any unsaved changes in a form will be lost.</p>`,
      `<button class="btn btn-ghost" data-close-modal>Stay signed in</button><button class="btn btn-danger" id="confirmLogout">${icon("i-logout")}Log out</button>`
    );
    $("#confirmLogout").addEventListener("click", () => {
      closeModal();
      $("#app").hidden = true;
      $("#fabWrap").hidden = true;
      $("#loginGate").hidden = false;
      window.scrollTo(0, 0);
      toast("Signed out", "See you soon.", "info");
    });
  }

  /* ═════════ dropdowns ═════════ */
  function closeDropdowns(except) {
    ["#notifPanel", "#userPanel"].forEach((sel) => {
      if (sel === except) return;
      $(sel).classList.remove("open");
    });
    ["#notifBtn", "#userBtn"].forEach((sel) => $(sel).setAttribute("aria-expanded", "false"));
  }

  /* ═════════ event wiring ═════════ */
  function wireEvents() {
    // login
    $("#loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("#loginEmail").value.trim();
      const pass = $("#loginPassword").value;
      const role = $("#loginRole").value;
      if (email !== "admin@arjunahall.in" || pass !== "demo1234") {
        $("#loginError").classList.add("show");
        return;
      }
      $("#loginError").classList.remove("show");
      S.role = role;
      const rule = ROLE_RULES[role];
      S.user.role = rule.label;
      $("#userRole").textContent = rule.label;
      $("#userName").textContent = S.user.name;
      $("#dpName").textContent = S.user.name;
      $("#dpEmail").textContent = S.user.email;
      showApp($("#rememberMe").checked);
      toast("Welcome back", `Signed in as ${rule.label}.`);
    });
    $("#demoFill").addEventListener("click", () => {
      $("#loginEmail").value = "admin@arjunahall.in";
      $("#loginPassword").value = "demo1234";
      $("#loginError").classList.remove("show");
      $("#loginPassword").focus();
    });
    $("#forgotLink").addEventListener("click", (e) => {
      e.preventDefault();
      toast("Password reset sent", "Check admin@arjunahall.in for a reset link in this demo.", "info");
    });
    $("#loginYear").textContent = new Date().getFullYear();

    // nav
    $$(".nav-item[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
    $$("[data-goto]").forEach((b) =>
      b.addEventListener("click", () => {
        setView(b.dataset.goto);
        if (b.dataset.tab) { setTab(b.dataset.tab); }
        closeDropdowns();
      })
    );

    // hamburger / collapse
    $("#burger").addEventListener("click", () => {
      const open = document.body.classList.toggle("sidebar-open");
      $("#burger").setAttribute("aria-expanded", String(open));
    });
    $("#sidebarScrim").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
    $("#collapseBtn").addEventListener("click", () => applyMini(!S.mini));

    // dropdowns
    $("#notifBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = $("#notifPanel");
      const willOpen = !panel.classList.contains("open");
      closeDropdowns(willOpen ? "#notifPanel" : null);
      panel.classList.toggle("open", willOpen);
      $("#notifBtn").setAttribute("aria-expanded", String(willOpen));
    });
    $("#userBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = $("#userPanel");
      const willOpen = !panel.classList.contains("open");
      closeDropdowns(willOpen ? "#userPanel" : null);
      panel.classList.toggle("open", willOpen);
      $("#userBtn").setAttribute("aria-expanded", String(willOpen));
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown")) closeDropdowns();
      if (!e.target.closest(".topbar-search")) $("#searchPop").hidden = true;
    });

    $("#markAllRead").addEventListener("click", () => {
      D.notifications.forEach((n) => (n.unread = false));
      renderNotifications();
      toast("All caught up", "Notifications marked as read.", "info");
    });
    $("#notifList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-notif]");
      if (!btn) return;
      const n = D.notifications.find((x) => x.id === +btn.dataset.notif);
      if (n) {
        n.unread = false;
        renderNotifications();
        toast(n.title, n.body, "info");
      }
    });

    $("#themeQuick").addEventListener("click", () => {
      applyTheme(S.theme === "dark" ? "light" : "dark");
      closeDropdowns();
    });
    $("#logoutBtn").addEventListener("click", () => { closeDropdowns(); logout(); });
    $("#langBtn").addEventListener("click", () => toast("English (India)", "Only English is wired up in this demo.", "info"));

    // global search
    const gs = $("#globalSearch");
    gs.addEventListener("input", (e) => renderSearch(e.target.value));
    gs.addEventListener("focus", (e) => { if (e.target.value.trim()) renderSearch(e.target.value); });
    gs.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { $("#searchPop").hidden = true; gs.blur(); }
      if (e.key === "Enter") {
        const first = $("#searchPop button");
        if (first) { e.preventDefault(); first.click(); }
      }
    });
    $("#searchPop").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      gs.value = "";
      $("#searchPop").hidden = true;
      if (btn.dataset.searchView) setView(btn.dataset.searchView);
      else if (btn.dataset.searchAction) handleAction(btn.dataset.searchAction);
      else if (btn.dataset.searchBooking) openBooking(btn.dataset.searchBooking);
      else if (btn.dataset.searchCustomer) openCustomer(btn.dataset.searchCustomer);
    });
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        gs.focus();
      }
      if (e.key === "Escape") {
        closeModal();
        if ($("#drawer").classList.contains("open")) closeDrawer();
        closeDropdowns();
      }
    });

    // range filter
    $$("#rangeFilter button").forEach((b) =>
      b.addEventListener("click", () => {
        $$("#rangeFilter button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        S.range = +b.dataset.range;
        renderOverview();
        toast("Range updated", `Showing the last ${b.textContent.trim()}.`, "info");
      })
    );
    $$("#reportRange button").forEach((b) =>
      b.addEventListener("click", () => {
        $$("#reportRange button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        S.reportRange = +b.dataset.range;
        renderReports();
      })
    );
    $("#refreshBtn").addEventListener("click", () => {
      $("#refreshBtn").classList.add("spinning");
      setTimeout(() => $("#refreshBtn").classList.remove("spinning"), 700);
      renderOverview();
      logActivity("i-refresh", `<b>${esc(S.user.name.split(" ")[0])}</b> refreshed live metrics`);
      toast("Dashboard refreshed", "Metrics are up to date.", "info");
    });
    $("#chartExport").addEventListener("click", () => exportCSV("revenue"));

    // FAB
    $("#fabMain").addEventListener("click", () => {
      const w = $("#fabWrap");
      const open = w.classList.toggle("open");
      $("#fabMain").setAttribute("aria-expanded", String(open));
    });

    // tabs
    $$(".tab").forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));

    // table search / filters / sort / pagination
    $("#bookingSearch").addEventListener("input", (e) => { S.search.bookings = e.target.value; S.page.bookings = 1; renderBookingsTable(); });
    $("#customerSearch").addEventListener("input", (e) => { S.search.customers = e.target.value; S.page.customers = 1; renderCustomersTable(); });
    $("#invoiceSearch").addEventListener("input", (e) => { S.search.invoices = e.target.value; S.page.invoices = 1; renderInvoicesTable(); });

    $("#bookingChips").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      $$("#bookingChips .chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      S.filter.bookings = chip.dataset.status;
      S.page.bookings = 1;
      renderBookingsTable();
    });
    $("#customerChips").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      $$("#customerChips .chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      S.filter.customers = chip.dataset.status;
      S.page.customers = 1;
      renderCustomersTable();
    });
    $$('[data-target="invoices"]').forEach((chip) =>
      chip.addEventListener("click", () => {
        $$('[data-target="invoices"]').forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        S.filter.invoices = chip.dataset.status;
        S.page.invoices = 1;
        renderInvoicesTable();
      })
    );

    $("#customersSort").addEventListener("click", () => {
      S.sort.customers.key = S.sort.customers.key === "spend" ? "events" : "spend";
      S.sort.customers.dir = -1;
      renderCustomersTable();
    });
    $$("#bookingsTable th.sortable").forEach((th) =>
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        S.sort.bookings = { key, dir: S.sort.bookings.key === key ? -S.sort.bookings.dir : -1 };
        renderBookingsTable();
      })
    );

    document.addEventListener("click", (e) => {
      const pgBtn = e.target.closest("[data-page]");
      if (pgBtn && !pgBtn.disabled) {
        const target = pgBtn.dataset.target;
        S.page[target] = +pgBtn.dataset.page;
        if (target === "bookings") renderBookingsTable();
        if (target === "customers") renderCustomersTable();
        if (target === "invoices") renderInvoicesTable();
        return;
      }
      const rowBtn = e.target.closest("[data-open-booking], [data-edit-booking], [data-delete-booking], [data-open-customer], [data-edit-customer], [data-delete-customer], [data-open-invoice], [data-mark-paid], [data-download-invoice], [data-confirm-booking]");
      if (rowBtn) {
        const d = rowBtn.dataset;
        if (d.openBooking) openBooking(d.openBooking);
        else if (d.editBooking) openBookingModal(d.editBooking);
        else if (d.deleteBooking) confirmDelete("booking", d.deleteBooking);
        else if (d.openCustomer) openCustomer(d.openCustomer);
        else if (d.editCustomer) openCustomerModal(d.editCustomer);
        else if (d.deleteCustomer) confirmDelete("customer", d.deleteCustomer);
        else if (d.openInvoice) openInvoice(d.openInvoice);
        else if (d.downloadInvoice) downloadInvoice(d.downloadInvoice);
        else if (d.markPaid) {
          const inv = D.invoices.find((i) => i.id === d.markPaid);
          if (inv) {
            inv.status = "paid";
            toast("Payment recorded", `${inv.id} marked paid — ${inr(inv.amount)}.`);
            logActivity("i-rupee", `<b>${esc(S.user.name.split(" ")[0])}</b> marked <b>${esc(inv.id)}</b> paid`);
            closeDrawer();
            setView(S.view);
          }
        } else if (d.confirmBooking) {
          const b = D.bookings.find((x) => x.id === d.confirmBooking);
          if (b) {
            b.status = "confirmed";
            toast("Booking confirmed", `${b.id} — ${b.customer} is locked in.`);
            logActivity("i-check-circle", `<b>${esc(S.user.name.split(" ")[0])}</b> confirmed booking <b>${esc(b.id)}</b>`);
            closeDrawer();
            setView(S.view);
          }
        }
        return;
      }

      const copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        const val = copyBtn.dataset.copy;
        if (navigator.clipboard) navigator.clipboard.writeText(val).then(() => toast("Copied", val + " copied to clipboard.", "info"));
        return;
      }

      const closeBtn = e.target.closest("[data-close-modal]");
      if (closeBtn) closeModal();
      const closeDrawerBtn = e.target.closest("[data-close-drawer]");
      if (closeDrawerBtn) closeDrawer();
    });

    // actions
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      handleAction(btn.dataset.action, btn.dataset);
    });

    $("#drawerClose").addEventListener("click", closeDrawer);
    $("#scrim").addEventListener("click", closeDrawer);
    $("#modalClose").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => { if (e.target === $("#modal")) closeModal(); });

    // settings
    $("#saveSettings").addEventListener("click", () => {
      const first = $("#setFirstName").value.trim();
      const last = $("#setLastName").value.trim();
      S.user.name = `${first} ${last}`.trim() || S.user.name;
      S.user.email = $("#setEmail").value.trim();
      S.user.avatar = initials(S.user.name);
      $("#userName").textContent = S.user.name;
      $("#dpName").textContent = S.user.name;
      $("#dpEmail").textContent = S.user.email;
      $("#userAvatar").textContent = S.user.avatar;
      toast("Settings saved", "Your profile and preferences are updated.");
      logActivity("i-settings", `<b>${esc(first)}</b> updated workspace settings`);
    });
    $("#resetSettings").addEventListener("click", () => {
      syncSettingsUI();
      toast("Changes discarded", "Form reset to saved values.", "info");
    });
    $$('input[name="themeChoice"]').forEach((r) =>
      r.addEventListener("change", () => applyTheme(r.value))
    );
    $("#themeQuick").addEventListener("click", () => applyTheme(S.theme === "dark" ? "light" : "dark"));
    $("#miniSidebar").addEventListener("change", (e) => applyMini(e.target.checked));
    $("#showSparks").addEventListener("change", (e) => {
      S.sparks = e.target.checked;
      localStorage.setItem("arjuna:sparks", S.sparks);
      setView(S.view);
    });
    $("#compactRows").addEventListener("change", (e) => {
      S.compact = e.target.checked;
      $$("table.data").forEach((t) => (t.style.fontSize = S.compact ? ".78rem" : ""));
      toast("Table density", S.compact ? "Compact rows on." : "Comfortable rows.", "info");
    });
    $("#animateCharts").addEventListener("change", (e) => {
      S.animate = e.target.checked;
      renderAllCharts();
    });
    $("#matchSystem").addEventListener("change", (e) => {
      if (e.target.checked) applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    });
    $("#changePassBtn").addEventListener("click", () => {
      const np = $("#newPass").value;
      const cp = $("#confPass").value;
      if (np.length < 10) return toast("Password too short", "Use at least 10 characters.", "error");
      if (np !== cp) return toast("Passwords don't match", "Re-type the new password.", "error");
      $("#newPass").value = "";
      $("#confPass").value = "";
      toast("Password updated", "Use it next time you sign in.");
    });
    $("#inviteBtn").addEventListener("click", () => {
      const email = $("#inviteEmail").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return toast("Check the email", "Enter a valid work email.", "error");
      toast("Invitation sent", `${email} will get a sign-in link.`, "info");
      $("#inviteName").value = "";
      $("#inviteEmail").value = "";
    });
    $("#resetDataBtn").addEventListener("click", () => {
      openModal(
        "Reset demo data?",
        "This restores the original sample dataset.",
        `<p style="font-size:.9rem;color:var(--ink-2)">Any bookings, customers or invoices you added in this session will be replaced by the demo data.</p>`,
        `<button class="btn btn-ghost" data-close-modal>Cancel</button><button class="btn btn-danger" id="doReset">${icon("i-refresh")}Reset data</button>`
      );
      $("#doReset").addEventListener("click", () => {
        localStorage.removeItem("arjuna:data");
        closeModal();
        location.reload();
      });
    });
  }

  function handleAction(action, data) {
    if (!action) return;
    if (!ROLE_RULES[S.role].canWrite && ["new-booking", "new-invoice", "add-customer"].includes(action)) {
      return toast("Read-only role", "Switch to Manager or Admin to make changes.", "error");
    }
    if (action === "new-booking") openBookingModal(null);
    else if (action === "new-invoice") openInvoiceModal();
    else if (action === "add-customer") openCustomerModal(null);
    else if (action === "export-report") exportCSV("bookings");
    else if (action === "export-csv") exportCSV((data && data.export) || "bookings");
    else if (action === "print-report") {
      toast("Opening print dialog", "Choose 'Save as PDF' to keep a copy.", "info");
      setTimeout(() => window.print(), 400);
    }
  }

  /* ═════════ boot ═════════ */
  function boot() {
    renderNotifications();
    $("#badgeOrders").textContent = pendingCount();
    $("#badgeCustomers").textContent = D.customers.length;
    wireEvents();
    $("#userAvatar").textContent = initials(S.user.name);
    $("#userName").textContent = S.user.name;
    $("#dpName").textContent = S.user.name;

    applyTheme(localStorage.getItem("arjuna:theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), false);
    applyMini(localStorage.getItem("arjuna:mini") === "true");

    const authed = localStorage.getItem("arjuna:authed") === "1";
    if (authed) {
      S.role = "admin";
      showApp(false);
    } else {
      $("#loginGate").hidden = false;
      $("#app").hidden = true;
      $("#loginPassword").focus();
    }

    // greeting
    const d = new Date();
    const greeting = $("#overviewGreeting");
    if (greeting) {
      const hour = d.getHours();
      const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
      greeting.textContent = `${d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Good ${part} — hall open till 7:30 PM`;
    }
  }

  // re-render charts on resize (viewBox keeps them fluid; redraw keeps labels legible)
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!$("#app").hidden) renderAllCharts();
    }, 300);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
