/* Adersh Footwear — store */

const PRODUCTS = [
  {
    id: "apex-runner",
    name: "Apex Runner",
    subtitle: "Cream mesh · gum sole",
    price: 4890,
    compare: 5690,
    cats: ["sneakers", "men"],
    badge: "New",
    img: "images/apex-runner.jpg",
    desc: "A daily runner in cream mesh and suede, finished with a cognac heel tab and a grippy gum sole. Light on the foot, loud in the room.",
    sizes: [6, 7, 8, 9, 10, 11],
    rating: 4.8,
    reviews: 126,
    featured: true,
  },
  {
    id: "nightwalker",
    name: "Nightwalker",
    subtitle: "Matte black leather",
    price: 5490,
    cats: ["sneakers", "men", "formal"],
    badge: "Bestseller",
    img: "images/nightwalker.jpg",
    desc: "An all-black leather court shoe that disappears under a kurta and holds its own with a suit. One pair, entire week.",
    sizes: [6, 7, 8, 9, 10, 11, 12],
    rating: 4.9,
    reviews: 214,
    featured: false,
  },
  {
    id: "gold-court",
    name: "Gold Court",
    subtitle: "Ivory · champagne stripe",
    price: 4290,
    compare: 4990,
    cats: ["sneakers", "women"],
    badge: "New",
    img: "images/gold-court.jpg",
    desc: "A low court sneaker in ivory leather with a champagne gold stripe. Evening-adjacent, all-day comfortable.",
    sizes: [3, 4, 5, 6, 7, 8],
    rating: 4.7,
    reviews: 98,
    featured: true,
  },
  {
    id: "velocity",
    name: "Velocity",
    subtitle: "Olive knit · air sole",
    price: 6290,
    cats: ["sport", "sneakers", "men"],
    badge: "",
    img: "images/velocity.jpg",
    desc: "A performance runner in deep olive with burnt-orange piping and a translucent air sole. Built for the sea-link and the Sunday long run.",
    sizes: [7, 8, 9, 10, 11, 12],
    rating: 4.6,
    reviews: 71,
    featured: false,
  },
  {
    id: "oxford-prime",
    name: "Oxford Prime",
    subtitle: "Cognac calf · cap toe",
    price: 7490,
    cats: ["formal", "men"],
    badge: "Bestseller",
    img: "images/oxford-prime.jpg",
    desc: "Full-grain cognac calf, a closed lacing, a cap toe that takes a shine. The house oxford — lasted in Bandra, meant for decades.",
    sizes: [6, 7, 8, 9, 10, 11],
    rating: 4.9,
    reviews: 188,
    featured: false,
  },
  {
    id: "loafer-noir",
    name: "Loafer Noir",
    subtitle: "Black penny · tan lining",
    price: 6890,
    cats: ["formal", "men"],
    badge: "",
    img: "images/loafer-noir.jpg",
    desc: "A polished black penny loafer with a tan calf lining. Slip on, walk out. The quietest flex in the room.",
    sizes: [6, 7, 8, 9, 10, 11],
    rating: 4.8,
    reviews: 142,
    featured: false,
  },
  {
    id: "chelsea-ember",
    name: "Chelsea Ember",
    subtitle: "Cognac leather · elastic",
    price: 8290,
    cats: ["boots", "men"],
    badge: "New",
    img: "images/chelsea-ember.jpg",
    desc: "A chelsea in warm cognac with a lugged sole and a pull tab that actually works. Softens through a monsoon. Looks richer after.",
    sizes: [6, 7, 8, 9, 10, 11],
    rating: 4.9,
    reviews: 163,
    featured: true,
  },
  {
    id: "desert-walk",
    name: "Desert Walk",
    subtitle: "Sand suede · crepe sole",
    price: 5990,
    cats: ["boots", "men"],
    badge: "Low stock",
    img: "images/desert-walk.jpg",
    desc: "Tan suede chukkas on a crepe sole. The weekend boot — Goa, a gallery opening, a dusty train platform.",
    sizes: [7, 8, 9, 10, 11],
    rating: 4.7,
    reviews: 87,
    featured: false,
  },
  {
    id: "silk-step",
    name: "Silk Step",
    subtitle: "Cognac stiletto",
    price: 6490,
    cats: ["women", "formal"],
    badge: "New",
    img: "images/silk-step.jpg",
    desc: "A pointed-toe pump in cognac nappa. Slim, sure, unshowy. The heel you forget you are wearing until someone asks.",
    sizes: [3, 4, 5, 6, 7, 8],
    rating: 4.8,
    reviews: 119,
    featured: false,
  },
];

const FREE_SHIP = 2999;
const SHIP_FEE = 149;
const inr = (n) => "₹" + n.toLocaleString("en-IN");

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let filter = "all";
let query = "";
let activeProduct = null;
let activeSize = null;
let cart = loadCart();

const searchBar = $("#searchBar");
const navToggle = $("#navToggle");
const mobileMenu = $("#mobileMenu");
function closeMobileMenu() {
  mobileMenu.hidden = true;
  navToggle.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem("adersh-cart") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveCart() {
  localStorage.setItem("adersh-cart", JSON.stringify(cart));
}

function badgeClass(b) {
  if (b === "New") return "new";
  if (b === "Low stock") return "low";
  return "";
}

function productCard(p, featured = false) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = featured ? "f-card" : "p-card";
  el.dataset.id = p.id;
  const price = p.compare
    ? `${inr(p.price)}<span class="was">${inr(p.compare)}</span>`
    : inr(p.price);
  const badge = p.badge ? `<span class="badge ${badgeClass(p.badge)}">${p.badge}</span>` : "";
  if (featured) {
    el.innerHTML = `
      <img src="${p.img}" alt="${p.name}" />
      <div class="f-body">
        <p class="kicker">${p.badge || p.cats[0]}</p>
        <h3>${p.name}</h3>
        <p class="sub">${p.subtitle}</p>
        <p class="price">${price}</p>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="p-img">
        <img src="${p.img}" alt="${p.name}" />
        ${badge}
        <span class="quick">Quick view</span>
      </div>
      <h3>${p.name}</h3>
      <p class="sub">${p.subtitle}</p>
      <p class="price">${price}</p>`;
  }
  el.addEventListener("click", () => openProduct(p.id));
  return el;
}

function visibleProducts() {
  const q = query.trim().toLowerCase();
  return PRODUCTS.filter((p) => {
    const okFilter = filter === "all" || p.cats.includes(filter);
    const okQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.cats.join(" ").includes(q) ||
      p.desc.toLowerCase().includes(q);
    return okFilter && okQuery;
  });
}

function renderShop() {
  const grid = $("#productGrid");
  const empty = $("#emptyState");
  const list = visibleProducts();
  grid.innerHTML = "";
  list.forEach((p) => grid.appendChild(productCard(p)));
  empty.hidden = list.length > 0;
  $("#shopCount").textContent = `${list.length} pair${list.length === 1 ? "" : "s"}`;
}

function renderFeatured() {
  const row = $("#featuredRow");
  row.innerHTML = "";
  PRODUCTS.filter((p) => p.featured).forEach((p) => row.appendChild(productCard(p, true)));
}

function openProduct(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  activeProduct = p;
  activeSize = null;
  $("#pmImg").src = p.img;
  $("#pmImg").alt = p.name;
  $("#pmName").textContent = p.name;
  $("#pmSub").textContent = p.subtitle;
  $("#pmDesc").textContent = p.desc;
  $("#pmBadge").textContent = p.badge || p.cats[0];
  $("#pmPrice").innerHTML = p.compare
    ? `${inr(p.price)} <span class="was">${inr(p.compare)}</span>`
    : inr(p.price);
  $("#pmMeta").textContent = `${p.rating} ★ · ${p.reviews} reviews · UK sizing`;
  $("#pmQty").value = 1;
  const sizes = $("#pmSizes");
  sizes.innerHTML = "";
  p.sizes.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "size";
    b.textContent = s;
    b.addEventListener("click", () => {
      activeSize = s;
      $$(".size", sizes).forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
    });
    sizes.appendChild(b);
  });
  $("#productModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeProduct() {
  $("#productModal").hidden = true;
  if ($("#cartDrawer").getAttribute("aria-hidden") === "true" && $("#checkModal").hidden) {
    document.body.style.overflow = "";
  }
}

function cartCount() {
  return cart.reduce((n, i) => n + i.qty, 0);
}
function cartSubtotal() {
  return cart.reduce((n, i) => n + i.price * i.qty, 0);
}

function renderCart() {
  const count = cartCount();
  const badge = $("#cartCount");
  badge.textContent = count;
  badge.hidden = count === 0;

  const body = $("#cartBody");
  const foot = $("#cartFoot");
  const ship = $("#shipNote");

  if (!cart.length) {
    body.innerHTML = `<p class="cart-empty">Your bag is empty. The drop is waiting.</p>`;
    foot.hidden = true;
    ship.textContent = `Free shipping over ${inr(FREE_SHIP)}.`;
    return;
  }

  body.innerHTML = "";
  cart.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <img src="${item.img}" alt="" />
      <div>
        <h4>${item.name}</h4>
        <p class="meta">UK ${item.size} · ${inr(item.price)}</p>
        <div class="qty" data-idx="${idx}">
          <button type="button" data-act="-">−</button>
          <input type="text" readonly value="${item.qty}" />
          <button type="button" data-act="+">+</button>
        </div>
        <button class="rm" type="button" data-rm="${idx}">Remove</button>
      </div>
      <strong>${inr(item.price * item.qty)}</strong>`;
    body.appendChild(row);
  });

  const sub = cartSubtotal();
  const shipping = sub >= FREE_SHIP ? 0 : SHIP_FEE;
  $("#subtotal").textContent = inr(sub);
  $("#shipping").textContent = shipping === 0 ? "Free" : inr(shipping);
  $("#grand").textContent = inr(sub + shipping);
  foot.hidden = false;

  const left = FREE_SHIP - sub;
  ship.textContent =
    left > 0
      ? `${inr(left)} more for free shipping.`
      : "Free shipping unlocked.";
}

function addToCart() {
  if (!activeProduct) return;
  if (activeSize == null) {
    toast("Choose a UK size first.");
    return;
  }
  const qty = Math.max(1, Math.min(6, parseInt($("#pmQty").value, 10) || 1));
  const key = activeProduct.id + "-" + activeSize;
  const existing = cart.find((i) => i.key === key);
  if (existing) existing.qty = Math.min(6, existing.qty + qty);
  else {
    cart.push({
      key,
      id: activeProduct.id,
      name: activeProduct.name,
      img: activeProduct.img,
      price: activeProduct.price,
      size: activeSize,
      qty,
    });
  }
  saveCart();
  renderCart();
  closeProduct();
  openCart();
  toast(`${activeProduct.name} · UK ${activeSize} added.`);
}

function openCart() {
  closeMobileMenu();
  searchBar.hidden = true;
  $("#overlay").hidden = false;
  $("#cartDrawer").classList.add("is-open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  $("#overlay").hidden = true;
  $("#cartDrawer").classList.remove("is-open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  if ($("#productModal").hidden && $("#checkModal").hidden) document.body.style.overflow = "";
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._id);
  toast._id = setTimeout(() => {
    t.hidden = true;
  }, 2400);
}

function openCheckout() {
  if (!cart.length) return;
  closeCart();
  $("#checkFormWrap").hidden = false;
  $("#checkDone").hidden = true;
  $("#checkModal").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeCheckout() {
  $("#checkModal").hidden = true;
  document.body.style.overflow = "";
}

/* ── wire up ── */
renderFeatured();
renderShop();
renderCart();

$("#navbar").classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", () => {
  $("#navbar").classList.toggle("is-scrolled", window.scrollY > 8);
});

$$("#filters .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    filter = chip.dataset.filter;
    $$("#filters .chip").forEach((c) => c.classList.toggle("is-on", c === chip));
    renderShop();
  });
});

$$(".cat-card").forEach((card) => {
  card.addEventListener("click", () => {
    filter = card.dataset.filter;
    $$("#filters .chip").forEach((c) => c.classList.toggle("is-on", c.dataset.filter === filter));
    renderShop();
    $("#shop").scrollIntoView({ behavior: "smooth" });
  });
});

$("#searchBtn").addEventListener("click", () => {
  const open = searchBar.hidden;
  searchBar.hidden = !open;
  if (open) {
    closeMobileMenu();
    $("#searchInput").focus();
  }
});
$("#searchClose").addEventListener("click", () => {
  searchBar.hidden = true;
  query = "";
  $("#searchInput").value = "";
  renderShop();
});
$("#searchInput").addEventListener("input", (e) => {
  query = e.target.value;
  filter = "all";
  $$("#filters .chip").forEach((c) => c.classList.toggle("is-on", c.dataset.filter === "all"));
  renderShop();
  if (query.trim()) {
    const shop = $("#shop");
    const r = shop.getBoundingClientRect();
    if (r.top > innerHeight * 0.65 || r.bottom < 140) {
      shop.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
});

navToggle.addEventListener("click", () => {
  const open = mobileMenu.hidden;
  mobileMenu.hidden = !open;
  navToggle.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  if (open) searchBar.hidden = true;
});
$$("#mobileMenu a").forEach((a) =>
  a.addEventListener("click", closeMobileMenu)
);

$("#cartBtn").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
$("#modalClose").addEventListener("click", closeProduct);
$("#productModal").addEventListener("click", (e) => {
  if (e.target === $("#productModal")) closeProduct();
});
$("#addBtn").addEventListener("click", addToCart);
$("#qtyMinus").addEventListener("click", () => {
  const n = Math.max(1, (parseInt($("#pmQty").value, 10) || 1) - 1);
  $("#pmQty").value = n;
});
$("#qtyPlus").addEventListener("click", () => {
  const n = Math.min(6, (parseInt($("#pmQty").value, 10) || 1) + 1);
  $("#pmQty").value = n;
});

$("#cartBody").addEventListener("click", (e) => {
  const rm = e.target.closest("[data-rm]");
  if (rm) {
    cart.splice(Number(rm.dataset.rm), 1);
    saveCart();
    renderCart();
    return;
  }
  const act = e.target.closest("[data-act]");
  if (!act) return;
  const idx = Number(act.parentElement.dataset.idx);
  if (!cart[idx]) return;
  if (act.dataset.act === "+") cart[idx].qty = Math.min(6, cart[idx].qty + 1);
  else cart[idx].qty = Math.max(1, cart[idx].qty - 1);
  saveCart();
  renderCart();
});

$("#checkoutBtn").addEventListener("click", openCheckout);
$("#checkClose").addEventListener("click", closeCheckout);
$("#checkModal").addEventListener("click", (e) => {
  if (e.target === $("#checkModal")) closeCheckout();
});
$("#checkForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const ref = "AF-" + Math.floor(100000 + Math.random() * 900000);
  $("#orderRef").textContent = `Order ${ref} · ${inr(cartSubtotal() + (cartSubtotal() >= FREE_SHIP ? 0 : SHIP_FEE))} · ${cartCount()} pair${cartCount() === 1 ? "" : "s"}`;
  cart = [];
  saveCart();
  renderCart();
  $("#checkFormWrap").hidden = true;
  $("#checkDone").hidden = false;
  e.target.reset();
});
$("#doneClose").addEventListener("click", closeCheckout);

$("#newsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  toast("You are on the list. Next drop, first look.");
  e.target.reset();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("#checkModal").hidden) closeCheckout();
  else if (!$("#productModal").hidden) closeProduct();
  else if ($("#cartDrawer").classList.contains("is-open")) closeCart();
  else if (!searchBar.hidden) searchBar.hidden = true;
  else closeMobileMenu();
});
