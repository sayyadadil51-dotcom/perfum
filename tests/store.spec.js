const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs/promises");

const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/", { waitUntil: "networkidle" });
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

const cards = (page) => page.locator("#productGrid .product-card");

test("uses the supplied store details, rating and real review excerpts", async ({ page }) => {
  await expect(page).toHaveTitle(/Y\. M\. Devnikar/);
  await expect(page.locator("h1")).toHaveText("Tradition. With a modern soul.");
  await expect(page.locator(".visit-details")).toContainText("Hanuman Rd, Jijau Nagar, Khadkali");
  await expect(page.locator(".visit-details")).toContainText("Udgir, Maharashtra 413517");
  await expect(page.locator(".visit-details")).toContainText("10:30 pm");
  await expect(page.locator(".review-summary")).toContainText("4.0");
  await expect(page.locator(".review-summary")).toContainText("19 Google reviews");
  await expect(page.locator(".review-card")).toHaveCount(3);
  await expect(page.locator(".review-grid")).toContainText("Uzair Shaikh");
  await expect(page.locator(".review-grid")).toContainText("Saleem Saatbhai");
  await expect(page.locator(".review-grid")).toContainText("Salman sayyad Official");
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(data["@type"]).toBe("ClothingStore");
  expect(data.aggregateRating).toEqual({ "@type": "AggregateRating", ratingValue: "4.0", reviewCount: "19" });
});

test("filters styles for women, men and occasions", async ({ page }) => {
  await expect(cards(page)).toHaveCount(4);
  await page.locator('[data-filter="women"]').click();
  await expect(cards(page)).toHaveCount(2);
  await expect(page.locator('[data-filter="women"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#productGrid")).toContainText("The Sage Saree");
  await page.locator('[data-filter="men"]').click();
  await expect(cards(page)).toHaveCount(2);
  await expect(page.locator("#productGrid")).toContainText("The Everyday Essential");
  await page.locator('[data-filter="occasion"]').click();
  await expect(cards(page)).toHaveCount(3);
  await page.locator('[data-filter="all"]').click();
  await expect(cards(page)).toHaveCount(4);
});

test("collection and navigation links select the corresponding edit", async ({ page }) => {
  await page.locator('.collection-card[data-filter-link="men"]').click();
  await expect(page).toHaveURL(/#styles$/);
  await expect(page.locator('[data-filter="men"]')).toHaveAttribute("aria-pressed", "true");
  await expect(cards(page)).toHaveCount(2);
  await page.locator('.nav-link[data-filter-link="women"]').click();
  await expect(page.locator('[data-filter="women"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#productGrid")).toContainText("The Festive Favourite");
});

test("searches looks and opens accessible quick-view details", async ({ page }) => {
  await page.locator("#searchButton").click();
  await expect(page.locator("#searchDialog")).toBeVisible();
  await expect(page.locator("#searchInput")).toBeFocused();
  await page.locator("#searchInput").fill("kurta");
  await expect(page.locator(".search-result")).toHaveCount(1);
  await page.locator(".search-result").click();
  await expect(page.locator("#searchDialog")).not.toBeVisible();
  await expect(page.locator("#quickDialog")).toBeVisible();
  await expect(page.locator("#quickTitle")).toHaveText("The Celebration Kurta");
  await expect(page.locator("#quickDialog")).toContainText("illustrative, not a stock listing");
  await page.locator("#quickSave").click();
  await expect(page.locator("#quickSave")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#quickDialog")).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveClass(/modal-open/);
  await expect(page.locator("#bagCount")).toHaveText("1");
});

test("search handles empty results safely and can be cleared", async ({ page }) => {
  await page.locator("#searchButton").click();
  const query = '<img src=x onerror="alert(1)">';
  await page.locator("#searchInput").fill(query);
  await expect(page.locator(".search-empty")).toBeVisible();
  await page.locator("#searchInput").press("Enter");
  await expect(page.locator("#activeSearchText")).toHaveText(`Styles matching “${query}”`);
  await expect(page.locator("#activeSearch img")).toHaveCount(0);
  await expect(cards(page)).toHaveCount(0);
  await page.locator("#clearSearch").click();
  await expect(cards(page)).toHaveCount(4);
  await expect(page.locator("#activeSearch")).not.toBeVisible();
});

test("saved looks survive reload, can be viewed, and can be removed", async ({ page }) => {
  await page.locator('#productGrid [data-save="sage-saree"]').click();
  await page.locator('#productGrid [data-save="olive-shirt"]').click();
  await expect(page.locator("#bagCount")).toHaveText("2");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#bagCount")).toHaveText("2");
  await expect(page.locator('#productGrid [data-save="sage-saree"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator("#shortlistButton").click();
  await expect(page.locator(".shortlist-item")).toHaveCount(2);
  await page.locator('#shortlistItems [data-save="sage-saree"]').click();
  await expect(page.locator(".shortlist-item")).toHaveCount(1);
  await page.locator('#shortlistItems [data-save="olive-shirt"]').click();
  await expect(page.locator(".shortlist-empty")).toBeVisible();
  await expect(page.locator("#shortlistFooter")).not.toBeVisible();
  await expect(page.locator("#bagCount")).not.toBeVisible();
  const focusIsInside = await page.evaluate(() => document.querySelector("#shortlistDialog").contains(document.activeElement));
  expect(focusIsInside).toBe(true);
  await page.locator("[data-browse-styles]").click();
  await expect(page.locator("#shortlistDialog")).not.toBeVisible();
  await expect(page).toHaveURL(/#styles$/);
});

test("offers a useful text download when clipboard access is denied", async ({ page }) => {
  await page.locator('#productGrid [data-save="sage-saree"]').click();
  await page.locator("#shortlistButton").click();
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async () => { throw new Error("Clipboard denied for test"); } }
  }));
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#copyList").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("devnikar-visit-list.txt");
  const text = await fs.readFile(await download.path(), "utf8");
  expect(text).toContain("The Sage Saree");
  expect(text).toContain("Hanuman Rd, Jijau Nagar, Khadkali");
  expect(text).toContain("not reserved products");
  await expect(page.locator("#copyList")).toContainText("downloaded instead");
});

test("quick-view traps keyboard focus and restores the trigger on Escape", async ({ page }) => {
  const trigger = page.locator('#productGrid .look-open[data-look="sage-saree"]');
  await trigger.click();
  await expect(page.locator(".quick-close")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#quickVisit")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".quick-close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("mobile menu opens, filters, closes and supports Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#menuButton").click();
  await expect(page.locator("#menuButton")).toHaveAttribute("aria-expanded", "true");
  await page.locator('.nav-link[data-filter-link="men"]').click();
  await expect(page.locator("#menuButton")).toHaveAttribute("aria-expanded", "false");
  await expect(cards(page)).toHaveCount(2);
  await page.locator("#menuButton").click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#menuButton")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#menuButton")).toBeFocused();
});

test("has no horizontal overflow at phone, tablet and desktop widths", async ({ page }) => {
  for (const width of [320, 360, 390, 600, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(
      () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      { message: `Overflow at ${width}px` }
    ).toBeLessThanOrEqual(0);
  }
});

test("uses real external maps directions and truthful service information", async ({ page }) => {
  const directionLink = page.locator(".visit-copy > a");
  await expect(directionLink).toHaveAttribute("target", "_blank");
  const link = new URL(await directionLink.getAttribute("href"));
  expect(link.hostname).toBe("www.google.com");
  expect(link.pathname).toBe("/maps/dir/");
  expect(link.searchParams.get("destination")).toContain("Y.M.DEVNIKAR");
  expect(link.searchParams.get("destination")).toContain("Udgir");
  await page.locator(".faq-list details").first().locator("summary").click();
  await expect(page.locator(".faq-list details").first()).toHaveAttribute("open", "");
  await expect(page.locator(".faq-list details").first()).toContainText("not an online checkout");
});

test("local image assets load successfully", async ({ page }) => {
  await page.evaluate(() => document.querySelectorAll("img").forEach((image) => { image.loading = "eager"; }));
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll("img")].every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
});

test("passes automated WCAG AA checks on the page and dialogs", async ({ page }) => {
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
  await page.keyboard.press("Escape");
  await page.locator('#productGrid [data-save="sage-saree"]').click();
  await page.locator("#shortlistButton").click();
  await scan();
});

test("essential information and directions remain available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(process.env.TEST_BASE_URL || "http://127.0.0.1:8000/", { waitUntil: "networkidle" });
  await expect(page.locator(".visit-details")).toContainText("Udgir, Maharashtra 413517");
  await expect(page.locator(".collection-card")).toHaveCount(3);
  await expect(page.locator("noscript p")).toContainText("Enable JavaScript");
  await expect(page.locator(".visit-copy > a")).toHaveAttribute("href", /google\.com\/maps\/dir/);
  await context.close();
});
