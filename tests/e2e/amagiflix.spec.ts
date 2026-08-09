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
