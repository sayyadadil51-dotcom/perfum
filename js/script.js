/* Y. M. Devnikar — bilingual discovery, local visit lists, and safe sharing. */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}" /></svg>`;
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const storageKey = "ym-devnikar-visit-list-v1";
  const i18n = window.DevnikarI18n;
  if (!i18n) return;
  let locale = i18n.initialLocale();
  const t = (key, values = {}) => i18n.t(key, locale, values);
  const number = (value, minimumDigits = 1) => i18n.formatNumber(value, locale, minimumDigits);
  const localLook = (look) => i18n.localizeLook(look, locale);
  const countText = (key, count, minimumDigits = 1) => t(`${key}.${count === 1 ? "one" : "other"}`, { count: number(count, minimumDigits) });

  // These are illustrative looks, not a claim about live inventory or pricing.
  const looks = [
    {
      id: "sage-saree", name: "The Sage Saree", category: "SAREE EDIT", colour: "SAGE",
      image: "images/saree-edit.webp",
      alt: "A sage green saree with a delicate gold border, editorial style inspiration",
      filters: ["women", "occasion"], tags: ["Saree inspiration", "Wedding guest", "Timeless elegance"],
      keywords: "saree sari silk sage green gold women wedding festive festival traditional drape elegant",
      description: "A softer take on celebration dressing. Muted sage, a golden border, and an easy, graceful drape make a lovely starting point for your next special-occasion look."
    },
    {
      id: "ivory-kurta", name: "The Celebration Kurta", category: "MEN’S EDIT", colour: "SAND",
      image: "images/menswear-edit.webp",
      alt: "A sand-coloured embroidered kurta and ivory trousers, editorial style inspiration",
      filters: ["men", "occasion"], tags: ["Kurta inspiration", "Festive dressing", "Understated detail"],
      keywords: "kurta men menswear ivory cream beige sand embroidery wedding festive festival traditional ethnic",
      description: "Quiet detail. Effortless presence. A neutral kurta-inspired look brings together classic traditional dressing and a modern, relaxed sensibility—for a festival, a family occasion, or a wedding."
    },
    {
      id: "wine-lehenga", name: "The Festive Favourite", category: "CELEBRATION EDIT", colour: "WINE",
      image: "images/festive-edit.webp",
      alt: "A wine-coloured embroidered lehenga, editorial celebration style inspiration",
      filters: ["women", "occasion"], tags: ["Lehenga inspiration", "Wedding moments", "Rich colour"],
      keywords: "lehenga women festive festival occasion celebration wedding maroon wine burgundy traditional ethnic gold",
      description: "Some moments call for a little more. Rich wine tones and golden accents are the inspiration behind this celebration look. Bring it along to the store and explore your own festive favourite."
    },
    {
      id: "olive-shirt", name: "The Everyday Essential", category: "EVERYDAY EDIT", colour: "OLIVE",
      image: "images/everyday-edit.webp",
      alt: "A relaxed olive shirt and ecru trousers, editorial everyday style inspiration",
      filters: ["men"], tags: ["Shirt inspiration", "Everyday style", "Easy neutrals"],
      keywords: "shirt men menswear olive green casual everyday daily relaxed modern contemporary cotton",
      description: "For the days with no dress code. An earthy olive palette and an easy silhouette make a fresh everyday mood. Discover casual styles in store and find the one that feels like you."
    }
  ];
  const byId = new Map(looks.map((look) => [look.id, look]));
  let filter = "all";
  let searchTerm = "";
  let currentLook = null;
  let toastTimer;
  let copyTimer;
  let actionStatusKey = null;
  let memoryOnly = false;
  const dialogs = $$("dialog");
  const menuButton = $("#menuButton");
  const navLinks = $("#navLinks");

  // URL input is allowlisted to existing look IDs. A shared link never saves items silently.
  const sharedValue = (new URLSearchParams(location.search).get("edit") || "").slice(0, 300);
  let sharedIds = [...new Set(sharedValue.split(".").filter((id) => byId.has(id)))];

  function readSaved() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return new Set(Array.isArray(value) ? value.filter((id) => byId.has(id)) : []);
    } catch { return new Set(); }
  }
  let saved = readSaved();

  function persistSaved() {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...saved]));
      memoryOnly = false;
    } catch { memoryOnly = true; }
  }

  function matchesQuery(look, query) {
    const mr = i18n.localizeLook(look, "mr");
    const haystack = `${look.name} ${look.category} ${look.colour} ${look.keywords} ${mr.name} ${mr.category} ${mr.colour} ${mr.keywords}`.normalize("NFC").toLocaleLowerCase();
    return query.normalize("NFC").toLocaleLowerCase().split(/\s+/).filter(Boolean).every((part) => haystack.includes(part));
  }

  function renderProduct(source) {
    const look = localLook(source);
    const isSaved = saved.has(look.id);
    return `<article class="product-card">
      <div class="product-image"><button class="look-open" data-look="${look.id}" aria-label="${escapeHTML(t("look.explore", { name: look.name }))}">
        <img src="${look.image}" alt="${escapeHTML(look.alt)}" width="1000" height="1300" loading="lazy" />
        <span class="quick-look">${escapeHTML(t("look.quick"))} ${icon("arrow")}</span></button>
        <button class="save-button${isSaved ? " saved" : ""}" data-save="${look.id}" aria-label="${escapeHTML(t(isSaved ? "look.remove" : "look.save", { name: look.name }))}" aria-pressed="${isSaved}">${icon("heart")}</button>
      </div><div class="product-meta"><p>${escapeHTML(look.category)} <span>·</span> ${escapeHTML(look.colour)}</p><button class="product-title" data-look="${look.id}">${escapeHTML(look.name)} ${icon("diagonal")}</button><span class="in-store-label">${escapeHTML(t("look.store"))}</span></div>
    </article>`;
  }

  function renderSharedBanner() {
    $("#sharedEditBanner").hidden = !sharedIds.length;
    $("#sharedEditTitle").textContent = t("shared.title");
    $("#sharedEditDescription").textContent = countText("shared.description", sharedIds.length);
    const alreadySaved = sharedIds.length > 0 && sharedIds.every((id) => saved.has(id));
    $("#saveSharedEdit").textContent = t(alreadySaved ? "shared.saved" : "shared.save");
    $("#saveSharedEdit").disabled = alreadySaved;
  }

  function clearSharedEdit() {
    if (!sharedIds.length) return;
    sharedIds = [];
    const url = new URL(location.href);
    url.searchParams.delete("edit");
    history.replaceState(null, "", url);
    renderSharedBanner();
  }

  function renderGrid() {
    const result = looks.filter((look) => (!sharedIds.length || sharedIds.includes(look.id)) && (filter === "all" || look.filters.includes(filter)) && matchesQuery(look, searchTerm));
    $("#productGrid").innerHTML = result.length ? result.map(renderProduct).join("")
      : `<div class="empty-grid">${icon("search")}<h3>${escapeHTML(t("empty.title"))}</h3><p>${escapeHTML(t("empty.description"))}</p><button data-reset-styles>${escapeHTML(t("empty.browse"))}</button></div>`;
    $("#styleCount").textContent = countText("looks", result.length, 2);
    $("#activeSearch").hidden = !searchTerm;
    $("#activeSearchText").textContent = searchTerm ? t("search.matching", { query: searchTerm }) : "";
    $$("[data-filter]").forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderSharedBanner();
  }

  function setFilter(value, resetQuery = false) {
    filter = ["all", "women", "men", "occasion"].includes(value) ? value : "all";
    if (resetQuery) searchTerm = "";
    renderGrid();
  }

  function renderSavedState() {
    $("#bagCount").textContent = number(saved.size);
    $("#bagCount").hidden = !saved.size;
    $("#shortlistButton").setAttribute("aria-label", countText("bag", saved.size));
    $$("[data-save]").forEach((button) => {
      const source = byId.get(button.dataset.save);
      if (!source) return;
      const isSaved = saved.has(source.id);
      button.classList.toggle("saved", isSaved);
      button.setAttribute("aria-pressed", String(isSaved));
      button.setAttribute("aria-label", t(isSaved ? "look.remove" : "look.save", { name: localLook(source).name }));
    });
    if (currentLook) {
      const isSaved = saved.has(currentLook.id);
      $("#quickSave").classList.toggle("saved", isSaved);
      $("#quickSave").setAttribute("aria-pressed", String(isSaved));
      $("#quickSave span").textContent = t(isSaved ? "quick.saved" : "quick.save");
    }
    renderSharedBanner();
  }

  function setActionStatus(key) {
    actionStatusKey = key;
    $("#listActionStatus").hidden = !key;
    $("#listActionStatus").textContent = key ? t(key) : "";
  }

  function resetActionButtons() {
    clearTimeout(copyTimer);
    $("#copyList").innerHTML = `${icon("copy")}<span>${escapeHTML(t("copy.label"))}</span>`;
    $("#shareList span").textContent = t("share.label");
  }

  function toggleSaved(id) {
    if (!byId.has(id)) return;
    const wasSaved = saved.has(id);
    if (wasSaved) saved.delete(id); else saved.add(id);
    persistSaved();
    setActionStatus(null);
    resetActionButtons();
    renderSavedState();
    const shortlist = $("#shortlistDialog");
    if (shortlist.open) {
      const restoreFocus = shortlist.contains(document.activeElement);
      renderShortlist();
      if (restoreFocus) ($("#shortlistItems [data-save]") || $(".close-dialog", shortlist)).focus();
    }
    const messageKey = wasSaved ? "toast.removed" : memoryOnly ? "toast.session" : "toast.added";
    if ($("#quickDialog").open && currentLook?.id === id) {
      $("#quickFeedback").hidden = false;
      $("#quickFeedback").textContent = t(messageKey);
    }
    showToast(t(messageKey), !wasSaved);
  }

  function renderShortlist() {
    const items = [...saved].map((id) => localLook(byId.get(id)));
    $("#shortlistItems").innerHTML = items.length ? items.map((look) => `<div class="shortlist-item">
      <img src="${look.image}" alt="${escapeHTML(look.alt)}" width="74" height="96" />
      <div class="shortlist-item-text"><button data-look="${look.id}">${escapeHTML(look.name)}</button><p>${escapeHTML(look.category)} · ${escapeHTML(look.colour)}</p><small>${escapeHTML(t("look.inspiration"))}</small></div>
      <button class="icon-button" data-save="${look.id}" aria-label="${escapeHTML(t("look.remove", { name: look.name }))}" aria-pressed="true">${icon("close")}</button>
    </div>`).join("") : `<div class="shortlist-empty">${icon("bag")}<h3>${escapeHTML(t("saved.emptyTitle"))}</h3><p>${escapeHTML(t("saved.emptyDescription"))}</p><button class="text-link" data-browse-styles>${escapeHTML(t("saved.browse"))} ${icon("arrow")}</button></div>`;
    $("#shortlistFooter").hidden = !items.length;
    $("#shortlistCount").textContent = countText("saved", items.length);
    $("#shortlistFooter > small").textContent = t(memoryOnly ? "saved.sessionNote" : "saved.note");
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
    if (!dialogs.some((item) => item.open)) document.body.classList.remove("modal-open");
  }
  function openDialog(dialog) {
    closeMenu();
    dialogs.forEach((item) => { if (item.open && item !== dialog) item.close(); });
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("modal-open");
    $("#toast").classList.remove("visible");
  }
  dialogs.forEach((dialog) => {
    dialog.addEventListener("keydown", (event) => {
      // Search inputs otherwise consume Escape to clear their value before the dialog closes.
      if (event.key === "Escape") { event.preventDefault(); closeDialog(dialog); return; }
      if (event.key !== "Tab") return;
      const controls = $$("a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])", dialog).filter((element) => element.getClientRects().length > 0);
      if (!controls.length) { event.preventDefault(); return; }
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener("close", () => {
      if (!dialogs.some((item) => item.open)) document.body.classList.remove("modal-open");
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog);
    });
  });

  function renderQuickLook() {
    if (!currentLook) return;
    const look = localLook(currentLook);
    $("#quickImage").src = look.image;
    $("#quickImage").alt = look.alt;
    $("#quickCategory").textContent = look.category;
    $("#quickTitle").textContent = look.name;
    $("#quickDescription").textContent = look.description;
    $("#quickTags").innerHTML = look.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
  }
  function openLook(id) {
    currentLook = byId.get(id);
    if (!currentLook) return;
    renderQuickLook();
    $("#quickFeedback").hidden = true;
    renderSavedState();
    openDialog($("#quickDialog"));
    $("#quickDialog").scrollTop = 0;
  }
  $("#quickSave").addEventListener("click", () => { if (currentLook) toggleSaved(currentLook.id); });
  $("#quickVisit").addEventListener("click", () => closeDialog($("#quickDialog")));
  function openShortlist() { renderShortlist(); openDialog($("#shortlistDialog")); }
  $("#shortlistButton").addEventListener("click", openShortlist);
  $("#footerShortlist").addEventListener("click", openShortlist);
  $("#toastList").addEventListener("click", openShortlist);
  $("#shortlistVisit").addEventListener("click", () => closeDialog($("#shortlistDialog")));

  function renderSearch() {
    const query = $("#searchInput").value.trim();
    const results = looks.filter((look) => matchesQuery(look, query));
    $("#searchResultHeading").textContent = query ? countText("found", results.length) : t("search.explore");
    $("#searchResults").innerHTML = results.length ? results.map((source) => {
      const look = localLook(source);
      return `<button class="search-result" data-look="${look.id}"><img src="${look.image}" alt="" width="54" height="68" /><span><strong>${escapeHTML(look.name)}</strong><small>${escapeHTML(look.category)} · ${escapeHTML(look.colour)}</small></span>${icon("diagonal")}</button>`;
    }).join("") : `<p class="search-empty">${escapeHTML(t("search.empty"))}<br />${escapeHTML(t("search.store"))}</p>`;
  }
  $("#searchButton").addEventListener("click", () => {
    $("#searchInput").value = "";
    renderSearch();
    openDialog($("#searchDialog"));
    $("#searchInput").focus();
  });
  $("#searchInput").addEventListener("input", renderSearch);
  $("#searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchTerm = $("#searchInput").value.trim();
    clearSharedEdit();
    setFilter("all");
    closeDialog($("#searchDialog"));
    location.hash = "styles";
    $("#styles").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  $("#clearSearch").addEventListener("click", () => { searchTerm = ""; renderGrid(); });

  function applyLocale(value, persist = true) {
    locale = value === "mr" ? "mr" : "en";
    i18n.applyStatic(locale);
    renderGrid();
    renderQuickLook();
    renderSavedState();
    renderShortlist();
    renderSearch();
    resetActionButtons();
    setActionStatus(actionStatusKey);
    menuButton.setAttribute("aria-label", t(navLinks.classList.contains("open") ? "menu.close" : "menu.open"));
    $("#year").textContent = number(new Date().getFullYear());
    if (persist) {
      i18n.persistLocale(locale);
      const url = new URL(location.href);
      if (locale === "mr" || sharedIds.length) url.searchParams.set("lang", locale); else url.searchParams.delete("lang");
      history.replaceState(null, "", url);
    }
  }

  document.addEventListener("click", (event) => {
    const language = event.target.closest("[data-locale]");
    if (language) { applyLocale(language.dataset.locale); return; }
    const close = event.target.closest("[data-close]");
    if (close) closeDialog(document.getElementById(close.dataset.close));
    const save = event.target.closest("[data-save]");
    if (save) { toggleSaved(save.dataset.save); return; }
    const look = event.target.closest("[data-look]");
    if (look) { openLook(look.dataset.look); return; }
    const tab = event.target.closest("[data-filter]");
    if (tab) setFilter(tab.dataset.filter);
    const link = event.target.closest("[data-filter-link]");
    if (link) { clearSharedEdit(); setFilter(link.dataset.filterLink, true); }
    const browse = event.target.closest("[data-browse-styles]");
    if (browse) {
      closeDialog($("#shortlistDialog"));
      clearSharedEdit();
      setFilter("all", true);
      location.hash = "styles";
    }
    if (event.target.closest("[data-reset-styles]")) { clearSharedEdit(); setFilter("all", true); }
  });
  $("#closeSharedEdit").addEventListener("click", () => { clearSharedEdit(); setFilter("all", true); $("[data-filter=all]").focus(); });
  $("#saveSharedEdit").addEventListener("click", () => {
    sharedIds.forEach((id) => saved.add(id));
    persistSaved();
    renderSavedState();
    showToast(t(memoryOnly ? "toast.session" : "shared.added"), true);
    $("#closeSharedEdit").focus();
  });

  function showToast(message, listAction = false) {
    clearTimeout(toastTimer);
    if (dialogs.some((dialog) => dialog.open)) return;
    $("#toastMessage").textContent = message;
    $("#toastList").hidden = !listAction;
    $("#toast").classList.add("visible");
    toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4300);
  }

  function shareUrl() {
    // Only look IDs and a language choice go into a shared URL, never stored visitor data.
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set("edit", [...saved].join("."));
    url.searchParams.set("lang", locale);
    url.hash = "styles";
    return url.href;
  }
  function visitListText(includeShareLink = false) {
    const list = [...saved].map((id, index) => {
      const look = localLook(byId.get(id));
      return `${number(index + 1)}. ${look.name} (${look.colour.toLocaleLowerCase()})`;
    }).join("\n");
    const link = includeShareLink ? `\n\n${t("list.link")}\n${shareUrl()}` : "";
    return `${t("list.title")}\n\n${list}\n\n${t("list.note")}\n\n${t("list.address")}\nhttps://www.google.com/maps/search/?api=1&query=Y.M.DEVNIKAR%20Hanuman%20Road%20Udgir${link}`;
  }
  function downloadText(text) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "devnikar-visit-list.txt";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copyOrDownload(text) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch { downloadText(text); return "downloaded"; }
  }
  $("#copyList").addEventListener("click", async () => {
    if (!saved.size) return;
    const result = await copyOrDownload(visitListText());
    const key = result === "copied" ? "copy.success" : "copy.downloaded";
    $("#copyList").innerHTML = `${icon("check")}<span>${escapeHTML(t(key))}</span>`;
    setActionStatus(key);
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { $("#copyList").innerHTML = `${icon("copy")}<span>${escapeHTML(t("copy.label"))}</span>`; }, 3500);
  });
  $("#shareList").addEventListener("click", async () => {
    if (!saved.size) return;
    const button = $("#shareList");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    setActionStatus("share.pending");
    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title: t("share.title"), text: visitListText(), url: shareUrl() });
          setActionStatus("share.success");
          return;
        } catch (error) {
          if (error?.name === "AbortError") { setActionStatus(null); return; }
          // A denied/unsupported native share falls back to copying, then a text download.
        }
      }
      const result = await copyOrDownload(visitListText(true));
      setActionStatus(result === "copied" ? "share.copied" : "share.downloaded");
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  });

  function closeMenu() {
    navLinks.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", t("menu.open"));
    $("use", menuButton).setAttribute("href", "#i-menu");
  }
  menuButton.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", t(open ? "menu.close" : "menu.open"));
    $("use", menuButton).setAttribute("href", open ? "#i-close" : "#i-menu");
  });
  $$("a", navLinks).forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navLinks.classList.contains("open")) { closeMenu(); menuButton.focus(); }
  });
  document.addEventListener("click", (event) => { if (!event.target.closest("#header")) closeMenu(); });
  window.matchMedia("(min-width: 1101px)").addEventListener("change", (event) => { if (event.matches) closeMenu(); });
  const onScroll = () => $("#header").classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) {
      saved = readSaved();
      setActionStatus(null);
      renderSavedState();
      if ($("#shortlistDialog").open) renderShortlist();
    }
    if (event.key === i18n.preferenceKey && !new URLSearchParams(location.search).has("lang")) applyLocale(event.newValue, false);
  });

  applyLocale(locale, false);
})();
