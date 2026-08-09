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

test("hero starts with the brand and exposes the newest title with its artwork", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Featured carousel" });
  await expect(hero.getByRole("heading", { name: "The AmagiFlix" })).toBeVisible();
  await expect(hero.getByRole("heading", { name: "What If Naruto Left Konoha" })).toHaveCount(0);
  await hero.getByRole("button", { name: "Show newest title: What If Naruto Left Konoha" }).click();
  await expect(hero.getByRole("heading", { name: "What If Naruto Left Konoha" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Play Episode 1" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=sNarutoE001");
  await expect(hero.locator('[style*="e2e-feature"]')).toHaveCount(1);
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

test("profile menu persists the name and exposes V2 settings", async ({ page }) => {
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
  await expect(page.getByRole("button", { name: /Import Watch History/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Browser Extension/ })).toHaveCount(0);
});

test("extension view exposes the stable Pages ZIP download", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("button", { name: /Browser Extension/ }).click();
  await expect(page.getByRole("link", { name: /Download Extension ZIP/ })).toHaveAttribute("href", /downloads\/amagiflix-companion\.zip$/);
  await expect(page.getByText(/chrome:\/\/extensions/)).toBeVisible();
});

test("history import marks a matching catalog movie without fabricated progress", async ({ page }) => {
  await page.goto("/");
  const videoId = await page.evaluate(async () => (await (await fetch("./data/catalog.json")).json()).movies[0].videoId as string);
  await page.getByRole("button", { name: "Import History" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([{ title: "Watched Full Movie", titleUrl: `https://youtube.com/watch?v=${videoId}`, products: ["YouTube"] }])),
  });
  await expect(page.getByRole("heading", { name: "History import complete" })).toBeVisible();
  await expect(page.getByText("Newly marked watched")).toBeVisible();
  const state = await page.evaluate((id) => JSON.parse(localStorage.getItem("amagiflix:library:v2")!).videos[id], videoId);
  expect(state.historyImport.watched).toBe(true);
  expect(state.extension?.progress).toBeUndefined();
});

test("measured extension progress renders a real progress bar", async ({ page }) => {
  await page.goto("/");
  const videoId = await page.evaluate(async () => (await (await fetch("./data/catalog.json")).json()).movies[0].videoId as string);
  await page.evaluate((id) => localStorage.setItem("amagiflix:library:v2", JSON.stringify({ schemaVersion: 2, videos: { [id]: { inMyList: false, extension: { videoId: id, started: true, watched: false, sources: ["extension"], progress: { currentSeconds: 42, durationSeconds: 100, measuredAt: "2026-01-01T00:00:00Z" } } } } })), videoId);
  await page.reload();
  await expect(page.getByLabel("42% watched").first()).toBeVisible();
});

test("shows appear once with a Season 1 episode list and canonical playback", async ({ page }) => {
  await page.goto("/");
  const sourceChannelId = await page.evaluate(async () => (await (await fetch("./data/catalog.json")).json()).sourceChannelId as string);
  expect(sourceChannelId).toBe("e2e-fixture");
  const show = page.getByRole("button", { name: "More information about What If Naruto Left Konoha" }).first();
  await expect(show.getByText("Series")).toBeVisible();
  await show.click();
  const dialog = page.getByRole("dialog", { name: "What If Naruto Left Konoha" });
  await expect(dialog.getByRole("heading", { name: "Season 1" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Watch Episode 1 on YouTube" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=sNarutoE001");
  await dialog.getByRole("button", { name: "Add show to My List" }).click();
  const showState = await page.evaluate(() => JSON.parse(localStorage.getItem("amagiflix:library:v2")!).shows["show-what-if-naruto-left-konoha-demo0001"]);
  expect(showState.inMyList).toBe(true);
});

test("Movies & Shows and Recommended expose mixed titles in the agreed order", async ({ page }) => {
  await page.goto("/");
  const recommended = page.getByRole("region", { name: "Recommended" });
  const recentlyAdded = page.getByRole("region", { name: "Recently Added Full Movies" });
  await expect(recommended).toBeVisible();
  const [recommendedBox, recentlyAddedBox] = await Promise.all([recommended.boundingBox(), recentlyAdded.boundingBox()]);
  expect(recommendedBox!.y).toBeLessThan(recentlyAddedBox!.y);
  await page.goto("/#/movies");
  await expect(page.getByRole("heading", { name: "Movies & Shows" })).toBeVisible();
  await expect(page.getByRole("button", { name: "More information about What If Naruto Left Konoha" })).toBeVisible();
  await page.goto("/#/search?q=conclusion");
  await expect(page.getByRole("button", { name: "More information about What If Naruto Left Konoha" })).toHaveCount(1);
});
