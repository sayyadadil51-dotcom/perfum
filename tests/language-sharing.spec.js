const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs/promises");

const errorsByPage = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  errorsByPage.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto("/", { waitUntil: "networkidle" });
});
test.afterEach(async ({ page }) => { expect(errorsByPage.get(page)).toEqual([]); });
const cards = (page) => page.locator("#productGrid .product-card");
const setMarathi = async (page) => page.locator('.announcement [data-locale="mr"]').click();
const saveSaree = async (page) => page.locator('#productGrid [data-save="sage-saree"]').click();

test("switches language without losing the selected edit or saved looks", async ({ page }) => {
  await page.locator('[data-filter="women"]').click();
  await saveSaree(page);
  await setMarathi(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "mr");
  await expect(page).toHaveTitle(/य\. म\. देवनीकर/);
  await expect(page.locator("h1")).toContainText("नवा साज");
  await expect(page.locator('[data-filter="women"]')).toHaveAttribute("aria-pressed", "true");
  await expect(cards(page)).toHaveCount(2);
  await expect(page.locator("#productGrid")).toContainText("सौम्य हिरवी साडी");
  await expect(page.locator("#bagCount")).toHaveText("१");
  await expect(page.locator('#productGrid [data-save="sage-saree"]')).toHaveAttribute("aria-pressed", "true");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "mr");
  await expect(page.locator("#bagCount")).toHaveText("१");
  await page.locator('.announcement [data-locale="en"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toHaveText("Tradition. With a modern soul.");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#bagCount")).toHaveText("1");
});

test("searches Marathi and English terms in either interface language", async ({ page }) => {
  await setMarathi(page);
  await page.locator("#searchButton").click();
  await expect(page.locator("#searchInput")).toHaveAttribute("placeholder", /साडी/);
  await page.locator("#searchInput").fill("साडी");
  await expect(page.locator(".search-result")).toHaveCount(1);
  await expect(page.locator("#searchResultHeading")).toHaveText("१ लुक सापडला");
  await page.locator(".search-result").click();
  await expect(page.locator("#quickTitle")).toHaveText("सौम्य हिरवी साडी");
  await page.locator("#quickSave").click();
  await expect(page.locator("#quickFeedback")).toBeVisible();
  await expect(page.locator("#quickFeedback")).toContainText("जतन केले");
  await page.keyboard.press("Escape");
  await page.locator('.announcement [data-locale="en"]').click();
  await page.locator("#searchButton").click();
  await page.locator("#searchInput").fill("कुर्ता");
  await expect(page.locator(".search-result")).toHaveCount(1);
  await expect(page.locator(".search-result")).toContainText("The Celebration Kurta");
  await page.keyboard.press("Escape");
  await setMarathi(page);
  await page.locator("#searchButton").click();
  await page.locator("#searchInput").fill("kurta");
  await expect(page.locator(".search-result")).toHaveCount(1);
  await expect(page.locator(".search-result")).toContainText("उत्सवाचा कुर्ता");
});

test("keeps original customer quotations in English in the Marathi interface", async ({ page }) => {
  await setMarathi(page);
  await expect(page.locator('.review-card blockquote[lang="en"]')).toHaveCount(3);
  await expect(page.locator(".review-grid")).toContainText("The best destination for wedding and festive clothing!");
  await expect(page.locator(".review-bottom > span")).toContainText("मूळ इंग्रजी");
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(data.aggregateRating.ratingValue).toBe("4.0");
  expect(data.aggregateRating.reviewCount).toBe("19");
});

test("language controls are keyboard accessible and keep focus", async ({ page }) => {
  const control = page.locator('.announcement [data-locale="mr"]');
  await control.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "mr");
  await expect(control).toBeFocused();
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.announcement [data-locale="en"]')).toHaveAttribute("aria-pressed", "false");
});

test("Marathi stays within phone, tablet and desktop viewports", async ({ page }) => {
  await setMarathi(page);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 360, 390, 600, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), { message: `Marathi overflow at ${width}px` }).toBeLessThanOrEqual(0);
  }
});

test("previews shared looks without automatically changing the recipient's saved list", async ({ page }) => {
  await page.goto("/?edit=sage-saree.ivory-kurta&lang=mr#styles", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "mr");
  await expect(page.locator("#sharedEditBanner")).toBeVisible();
  await expect(page.locator("#sharedEditDescription")).toContainText("२ लुक");
  await expect(cards(page)).toHaveCount(2);
  await expect(page.locator("#bagCount")).not.toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("ym-devnikar-visit-list-v1"))).toBeNull();
  await page.locator("#saveSharedEdit").click();
  await expect(page.locator("#bagCount")).toHaveText("२");
  await expect(page.locator("#saveSharedEdit")).toBeDisabled();
  await page.locator("#closeSharedEdit").click();
  await expect(page.locator("#sharedEditBanner")).not.toBeVisible();
  await expect(page.locator('[data-filter="all"]')).toBeFocused();
  await expect(cards(page)).toHaveCount(4);
  expect(new URL(page.url()).searchParams.has("edit")).toBe(false);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#bagCount")).toHaveText("२");
});

test("shared URLs ignore duplicates, unknown IDs and markup", async ({ page }) => {
  const params = new URLSearchParams({ edit: 'sage-saree.sage-saree.unknown.<img src=x onerror="alert(1)">' });
  await page.goto(`/?${params}#styles`, { waitUntil: "networkidle" });
  await expect(cards(page)).toHaveCount(1);
  await expect(page.locator("#sharedEditDescription")).toContainText("1 look was shared");
  await expect(page.locator("#sharedEditBanner img")).toHaveCount(0);
  await expect(page.locator("#bagCount")).not.toBeVisible();
  await page.goto("/?edit=not-a-look.other-unknown-id#styles", { waitUntil: "networkidle" });
  await expect(cards(page)).toHaveCount(4);
  await expect(page.locator("#sharedEditBanner")).not.toBeVisible();
});

test("native sharing creates a recipient-ready link with only allowed look IDs", async ({ page, browser }) => {
  await saveSaree(page);
  await page.locator('#productGrid [data-save="olive-shirt"]').click();
  await page.evaluate(() => {
    window.sharedData = null;
    window.clipboardTouched = false;
    Object.defineProperty(navigator, "share", { configurable: true, value: async (data) => { window.sharedData = data; } });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { window.clipboardTouched = true; } } });
  });
  await page.locator("#shortlistButton").click();
  await page.locator("#shareList").click();
  await expect(page.locator("#listActionStatus")).toContainText("was shared");
  const data = await page.evaluate(() => window.sharedData);
  expect(data.text).toContain("The Sage Saree");
  expect(data.text).toContain("not reserved products");
  const url = new URL(data.url);
  expect(url.searchParams.get("edit")).toBe("sage-saree.olive-shirt");
  expect(url.searchParams.get("lang")).toBe("en");
  expect(url.hash).toBe("#styles");
  expect(await page.evaluate(() => window.clipboardTouched)).toBe(false);
  const recipient = await browser.newContext();
  const receiver = await recipient.newPage();
  await receiver.goto(data.url, { waitUntil: "networkidle" });
  await expect(cards(receiver)).toHaveCount(2);
  await expect(receiver.locator("#bagCount")).not.toBeVisible();
  await recipient.close();
});

test("sharing falls back to a useful copied link when Web Share is unavailable", async ({ page }) => {
  await saveSaree(page);
  await page.evaluate(() => {
    window.copiedVisitList = "";
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text) => { window.copiedVisitList = text; } } });
  });
  await page.locator("#shortlistButton").click();
  await page.locator("#shareList").click();
  await expect(page.locator("#listActionStatus")).toContainText("Share link copied");
  const text = await page.evaluate(() => window.copiedVisitList);
  expect(text).toContain("Hanuman Rd, Jijau Nagar, Khadkali");
  const link = new URL(text.trim().split("\n").at(-1));
  expect(link.searchParams.get("edit")).toBe("sage-saree");
  await expect(page.locator("#shareList")).toBeEnabled();
});

test("cancelling a native share does not copy or download anything", async ({ page }) => {
  await saveSaree(page);
  await page.evaluate(() => {
    window.clipboardTouched = false;
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("Cancelled", "AbortError"); } });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { window.clipboardTouched = true; } } });
  });
  let downloads = 0;
  page.on("download", () => downloads++);
  await page.locator("#shortlistButton").click();
  await page.locator("#shareList").click();
  await expect(page.locator("#shareList")).toBeEnabled();
  await expect(page.locator("#shareList")).not.toHaveAttribute("aria-busy", "true");
  await expect(page.locator("#listActionStatus")).not.toBeVisible();
  expect(await page.evaluate(() => window.clipboardTouched)).toBe(false);
  expect(downloads).toBe(0);
});

test("downloads a localized shareable list when native sharing and clipboard are denied", async ({ page }) => {
  await setMarathi(page);
  await saveSaree(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("Denied", "NotAllowedError"); } });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denied"); } } });
  });
  await page.locator("#shortlistButton").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#shareList").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("devnikar-visit-list.txt");
  const text = await fs.readFile(await download.path(), "utf8");
  expect(text).toContain("सौम्य हिरवी साडी");
  expect(text).toContain("उदगीर");
  const link = new URL(text.trim().split("\n").at(-1));
  expect(link.searchParams.get("lang")).toBe("mr");
  expect(link.searchParams.get("edit")).toBe("sage-saree");
  await expect(page.locator("#listActionStatus")).toContainText("शेअर लिंक");
});

test("Marathi page, shared banner and dialogs pass automated WCAG AA checks", async ({ page }) => {
  await page.goto("/?edit=sage-saree.ivory-kurta&lang=mr#styles", { waitUntil: "networkidle" });
  const scan = async () => {
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  };
  await scan();
  await page.locator("#searchButton").click();
  await scan();
  await page.keyboard.press("Escape");
  await page.locator('#productGrid .look-open[data-look="sage-saree"]').click();
  await scan();
  await page.locator("#quickSave").click();
  await expect(page.locator("#quickFeedback")).toBeVisible();
  await scan();
  await page.keyboard.press("Escape");
  await page.locator("#shortlistButton").click();
  await scan();
});

test("the phone quick-view close button stays visible when details scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await setMarathi(page);
  await page.locator('#productGrid .look-open[data-look="sage-saree"]').click();
  await page.locator("#quickDialog").evaluate((dialog) => { dialog.scrollTop = dialog.scrollHeight; });
  const dialog = await page.locator("#quickDialog").boundingBox();
  await expect.poll(async () => {
    const button = await page.locator(".quick-close").boundingBox();
    return button.y >= dialog.y && button.y + button.height <= dialog.y + dialog.height;
  }).toBe(true);
  await page.locator(".quick-close").click();
  await expect(page.locator("#quickDialog")).not.toBeVisible();
});

test("language and session-only saving remain usable if storage writes are blocked", async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException("Storage denied", "SecurityError"); }; });
  await page.goto("/?lang=mr", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "mr");
  await page.locator('#productGrid .look-open[data-look="sage-saree"]').click();
  await page.locator("#quickSave").click();
  await expect(page.locator("#quickFeedback")).toContainText("या सत्रापुरतं");
  await page.keyboard.press("Escape");
  await page.locator("#shortlistButton").click();
  await expect(page.locator("#shortlistFooter > small")).toContainText("या सत्रापुरतं");
  await page.keyboard.press("Escape");
  await page.locator('.announcement [data-locale="en"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#bagCount")).toHaveText("1");
});

test("local serving exposes website assets, not Git or development files", async ({ request }) => {
  for (const path of ["/.git/config", "/.cache/", "/node_modules/", "/tests/store.spec.js", "/README.md", "/package.json", "/serve.py", "/images/"]) {
    const response = await request.get(path);
    expect(response.status(), `${path} must not be public`).toBe(404);
  }
  for (const path of ["/", "/index.html", "/css/style.css", "/js/i18n.js", "/favicon.svg", "/images/devnikar-hero.webp"]) {
    const response = await request.get(path);
    expect(response.status(), `${path} must load`).toBe(200);
  }
});

test("the local server accepts the preview host without blocking embedding", async ({ request }) => {
  const response = await request.get("/", { headers: {
    Host: "8000-store-preview.e2b.app",
    Origin: "https://8000-store-preview.e2b.app"
  } });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/html");
  expect(response.headers()["x-frame-options"]).toBeUndefined();
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});
