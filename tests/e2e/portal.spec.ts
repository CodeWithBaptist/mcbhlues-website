import { expect, test, type Page } from "@playwright/test";

const email = process.env.PORTAL_E2E_EMAIL;
const password = process.env.PORTAL_E2E_PASSWORD;
const routes = ["", "account/password", "activity-logs", "audit-logs", "bookings", "cms", "cms/announcements", "cms/faqs", "cms/legal", "cms/testimonials", "customers", "enquiries", "logs", "media", "notifications", "permissions", "properties", "reports", "roles", "settings/company", "settings/system", "staff"];

async function signIn(page: Page) {
  await page.goto("/portal/login");
  await page.getByLabel("Work email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/portal$/);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("authentication shell shares the public theme and handles unavailable storage", async ({ page }) => {
  await page.goto("/portal/login");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/public-dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/portal-dark/);
  const portalSurface = await page.locator("form").evaluate(el => getComputedStyle(el.closest(".bg-white")!).backgroundColor);
  await page.goto("/contact");
  await expect(page.locator("html")).toHaveClass(/public-dark/);
  expect(await page.locator(".public-site .bg-white").first().evaluate(el => getComputedStyle(el).backgroundColor)).toBe(portalSurface);
  await page.goto("/portal/login");
  await page.getByLabel("Password", { exact: true }).fill("preview-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await page.setViewportSize({ width: 320, height: 720 });
  await noOverflow(page);
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error("Storage blocked"); };
    Storage.prototype.getItem = () => { throw new Error("Storage blocked"); };
  });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.reload();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  expect(errors).toEqual([]);
});

test.describe("authenticated portal — use a disposable Super Admin account", () => {
  test.skip(!email || !password, "Set PORTAL_E2E_EMAIL and PORTAL_E2E_PASSWORD for a local test account.");
  test.beforeEach(async ({ page }) => signIn(page));

  test("every module renders at desktop, tablet and mobile sizes in both themes", async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text());
    });
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"]) {
        await page.evaluate(value => localStorage.setItem("mcbhlues-public-theme", value), theme);
        for (const route of routes) {
          const response = await page.goto(`/portal/${route}`);
          expect(response?.status(), route).toBe(200);
          await expect(page.locator("main h1")).toBeVisible();
          await expect(page.getByText("Access denied", { exact: true })).toHaveCount(0);
          await noOverflow(page);
          if (width === 390 && await page.locator(".portal-record-table").count()) {
            await expect(page.locator(".portal-record-table")).toHaveCSS("display", "block");
          }
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test("sidebar collapse, mobile focus containment, filters, and account navigation", async ({ page }) => {
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.getByRole("dialog", { name: "Portal navigation" });
    await expect(drawer.getByLabel("Filter navigation")).toBeVisible();
    await drawer.getByLabel("Filter navigation").fill("properties");
    await expect(drawer.getByRole("link", { name: "Properties", exact: true })).toBeVisible();
    await drawer.getByRole("link", { name: "Properties", exact: true }).click();
    await expect(drawer).toHaveCount(0);
    await expect(page).toHaveURL(/\/portal\/properties$/);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.keyboard.press("Shift+Tab");
    expect(await drawer.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Change password" }).click();
    await expect(page).toHaveURL(/\/portal\/account\/password$/);
  });

  test("property search, empty state, mobile actions and editor fields", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/portal/properties");
    const search = page.getByPlaceholder("Search by title or location...");
    await search.fill("no-property-matches-this-query");
    await expect(page.getByText("No properties found")).toBeVisible();
    await search.fill("");
    await page.getByRole("radio", { name: "For Rent" }).click();
    await expect(page.getByRole("radio", { name: "For Rent" })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("radio", { name: "All", exact: true }).click();
    await page.getByRole("button", { name: "Add property", exact: true }).click();
    const panel = page.locator(".portal-modal-panel");
    await expect(panel.getByLabel("Name", { exact: false }).first()).toBeVisible();
    await panel.getByRole("button", { name: "Create property", exact: true }).click();
    expect(await panel.locator("input:invalid").count()).toBeGreaterThan(0);
    await noOverflow(page);
    await panel.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(panel).toHaveCount(0);
  });

  test("existing create forms remain reachable without saving data", async ({ page }) => {
    for (const [route, action] of [
      ["customers", "Add customer"], ["bookings", "New booking"], ["staff", "Add staff member"],
      ["roles", "New role"], ["permissions", "New permission"], ["cms/faqs", "Add FAQ"],
      ["cms/announcements", "New announcement"], ["cms/testimonials", "Add testimonial"],
    ]) {
      await page.goto(`/portal/${route}`);
      await page.getByRole("button", { name: action, exact: true }).click();
      await expect(page.locator("main form").first()).toBeVisible();
      await noOverflow(page);
    }
  });

  test("sign-out, sign-in errors and expired invitations retain clear feedback", async ({ page }) => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menu", { name: "Account", exact: true }).getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/login$/);
    await page.getByLabel("Work email").fill("ui-missing-account@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("invalid-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.goto("/portal/invite/invalid-ui-test-token");
    await expect(page.getByText(/invalid|expired/i)).toBeVisible();
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await expect(page.locator("html")).toHaveClass(/public-dark/);
    await noOverflow(page);
  });

  test("theme changes propagate between tabs, survive navigation, and respect reduced motion", async ({ page, context }) => {
    const other = await context.newPage();
    await other.goto("/portal/properties");
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await expect(other.locator("html")).toHaveClass(/public-dark/);
    await other.goto("/portal/account/password");
    await expect(other.locator("html")).toHaveClass(/public-dark/);
    await other.emulateMedia({ reducedMotion: "reduce" });
    expect(await other.locator("main").evaluate(el => getComputedStyle(el).animationName)).toBe("none");
    await other.close();
  });
});

test("disposable property workflow: create, edit, publish, status, delete", async ({ page }) => {
  test.skip(!email || !password || process.env.PORTAL_E2E_ALLOW_WRITES !== "true", "Writes require an explicitly opted-in disposable database.");
  await signIn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/portal/properties");
  const name = `UI regression ${Date.now()}`;
  await page.getByRole("button", { name: "Add property", exact: true }).click();
  let panel = page.locator(".portal-modal-panel");
  await panel.getByPlaceholder("e.g. Azure Sky Penthouse").fill(name);
  await panel.getByPlaceholder("e.g. Skyline living above Victoria Island").fill("Temporary UI regression listing");
  await panel.getByLabel("Price", { exact: true }).fill("1000000");
  await panel.getByLabel("Published on the public website").uncheck();
  // Existing local asset exercises the actual upload path without external hosts.
  await panel.locator('input[type="file"]').setInputFiles("public/og-image.jpg");
  await expect(panel.locator("img")).toHaveCount(1);
  await panel.getByRole("button", { name: "Create property", exact: true }).click();
  await expect(panel).toHaveCount(0);
  await page.getByPlaceholder("Search by title or location...").fill(name);
  const row = page.locator("tbody tr").filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  panel = page.locator(".portal-modal-panel");
  await panel.getByLabel("Price", { exact: true }).fill("2000000");
  await panel.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(row).toContainText("2,000,000");
  await row.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(row.getByRole("button", { name: "Unpublish", exact: true })).toBeVisible();
  await row.getByLabel(`Status for ${name}`).selectOption("sold");
  await expect(row).toContainText("sold");
  await row.getByRole("button", { name: "Unpublish", exact: true }).click();
  await expect(row.getByRole("button", { name: "Publish", exact: true })).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(row).toHaveCount(0);
});
