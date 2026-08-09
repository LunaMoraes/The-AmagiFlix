import { expect, test } from "@playwright/test";

test("browses the catalog and opens accessible movie details", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  const recent = page.getByRole("region", { name: "Recently Added Full Movies" });
  await recent.getByRole("button", { name: /^More information about/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Watch on YouTube" })).toHaveAttribute("href", /youtube\.com\/watch\?v=[^&]+/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("search and My List work locally", async ({ page }) => {
  await page.goto("/#/search?q=Full%20Movie");
  await expect(page.getByText(/results? for “Full Movie”/i)).toBeVisible();
  await page.getByRole("button", { name: /^More information about/ }).first().click();
  await page.getByRole("button", { name: "Add to My List" }).click();
  await page.getByRole("button", { name: "Close details" }).click();
  await page.goto("/#/my-list");
  await expect(page.getByRole("button", { name: /^More information about/ }).first()).toBeVisible();
});

test("mobile navigation is available", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-specific assertion");
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: /Search/ })).toBeVisible();
});

test("collapsed search icon stays fully inside its control", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop header search is hidden on mobile");
  await page.goto("/");
  const search = page.getByRole("search");
  const trigger = page.getByRole("button", { name: "Open search" });
  const [searchBox, triggerBox] = await Promise.all([search.boundingBox(), trigger.boundingBox()]);
  expect(searchBox).not.toBeNull();
  expect(triggerBox).not.toBeNull();
  expect(triggerBox!.x).toBeGreaterThanOrEqual(searchBox!.x);
  expect(triggerBox!.x + triggerBox!.width).toBeLessThanOrEqual(searchBox!.x + searchBox!.width);
});

test("profile menu persists the name and exposes planned settings", async ({ page }) => {
  await page.goto("/");
  const wordmark = page.getByRole("link", { name: "The AmagiFlix home" });
  const wordmarkBefore = await wordmark.boundingBox();
  await page.getByRole("button", { name: "Open account menu" }).click();
  const panel = page.getByRole("dialog", { name: "Account menu" });
  await expect(panel).toHaveCSS("transform", "none");
  const [wordmarkAfter, panelBox] = await Promise.all([wordmark.boundingBox(), panel.boundingBox()]);
  expect(wordmarkAfter?.x).toBe(wordmarkBefore?.x);
  expect(panelBox!.x + panelBox!.width).toBe(page.viewportSize()!.width);
  expect(panelBox?.y).toBe(0);
  await page.getByRole("button", { name: /Profile Guest/ }).click();
  await page.getByRole("textbox", { name: "Display name" }).fill("Luna");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Open account menu" }).click();
  await expect(page.getByRole("button", { name: /Profile Luna/ })).toBeVisible();
  await page.getByRole("button", { name: /Settings Preferences and data/ }).click();
  await expect(page.getByRole("button", { name: /Import Watch History/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Browser Extension/ })).toHaveCount(0);
});
