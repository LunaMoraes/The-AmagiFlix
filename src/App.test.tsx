import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { LibraryProvider } from "./context/LibraryContext";
import { ProfileProvider } from "./context/ProfileContext";
import { PROFILE_STORAGE_KEY, STORAGE_KEY } from "./config/app";
import { ExtensionBridgeProvider } from "./context/ExtensionBridgeContext";
import { HistoryImportProvider } from "./context/HistoryImportContext";

const catalog = {
  schemaVersion: 1,
  generatedAt: "2026-01-01T00:00:00Z",
  sourceChannelId: "test",
  movieCount: 1,
  movies: [{ videoId: "abcDEF12345", title: "Naruto Full Movie", description: "A complete hero story.", publishedAt: "2026-01-01T00:00:00Z", durationSeconds: 7200, thumbnails: {}, categories: ["naruto"] }],
};
const catalogWithShow = {
  ...catalog,
  showCount: 1,
  shows: [{
    showId: "show-naruto-left",
    title: "What If Naruto Left Konoha",
    description: "An alternate Naruto timeline.",
    latestPublishedAt: "2026-02-02T00:00:00Z",
    thumbnails: { maxres: "https://example.com/newest-show.jpg" },
    categories: ["naruto"],
    seasonNumber: 1,
    episodes: [
      { videoId: "epNaruto001", title: "What If Naruto Left Konoha Part 1", description: "Sasuke searches for Naruto.", publishedAt: "2026-02-01T00:00:00Z", durationSeconds: 600, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1" },
      { videoId: "epNaruto002", title: "What If Naruto Left Konoha Final", description: "The final confrontation.", publishedAt: "2026-02-02T00:00:00Z", durationSeconds: 700, thumbnails: {}, episodeNumber: 2, episodeLabel: "Final" },
    ],
  }],
};

const renderApp = (entry = "/") => render(<MemoryRouter initialEntries={[entry]}><ExtensionBridgeProvider><HistoryImportProvider><ProfileProvider><LibraryProvider><App /></LibraryProvider></ProfileProvider></HistoryImportProvider></ExtensionBridgeProvider></MemoryRouter>);

afterEach(() => vi.restoreAllMocks());
beforeEach(() => localStorage.clear());

describe("App", () => {
  it("loads the catalog, opens details, and persists watch state before following the link", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalog }));
    const user = userEvent.setup();
    renderApp();
    const cards = await screen.findAllByRole("button", { name: /More information about Naruto Full Movie/i });
    await user.click(cards[0]);
    const dialog = await screen.findByRole("dialog");
    const watch = within(dialog).getByRole("link", { name: "Watch on YouTube" });
    fireEvent.click(watch);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.videos["abcDEF12345"].startedAt).toEqual(expect.any(String));
    expect(watch).toHaveAttribute("href", "https://www.youtube.com/watch?v=abcDEF12345");
  });

  it("toggles My List from details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalog }));
    const user = userEvent.setup();
    renderApp();
    const cards = await screen.findAllByRole("button", { name: /More information about Naruto Full Movie/i });
    await user.click(cards[0]);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Add to My List" }));
    expect(within(dialog).getByRole("button", { name: "Remove from My List" })).toBeInTheDocument();
  });

  it("shows a recoverable catalog error", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ ok: true, json: async () => catalog });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "The AmagiFlix" })).toBeInTheDocument());
  });

  it("stores the profile name and exposes V2 history settings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalog }));
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: "The AmagiFlix" });
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    await user.click(screen.getByRole("button", { name: /Profile Guest/ }));
    const name = screen.getByRole("textbox", { name: "Display name" });
    await user.clear(name);
    await user.type(name, "Luna");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)!).name).toBe("Luna");
    await user.click(screen.getByRole("button", { name: /Settings Preferences and data/ }));
    expect(screen.getByRole("button", { name: /Import Watch History/ })).toBeEnabled();
  });

  it("imports a matching history file locally and suppresses onboarding", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalog }));
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole("button", { name: "Import History" }));
    const dialog = screen.getByRole("dialog", { name: "Import YouTube History" });
    const file = new File([JSON.stringify([{ title: "Watched Naruto", titleUrl: "https://youtube.com/watch?v=abcDEF12345", products: ["YouTube"] }])], "history.json", { type: "application/json" });
    await user.upload(within(dialog).getByLabelText("Choose history file"), file);
    expect(await screen.findByRole("heading", { name: "History import complete" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).videos.abcDEF12345.historyImport).toMatchObject({ watched: true, importCount: 1 });
    expect(screen.queryByRole("heading", { name: "Import your existing YouTube history" })).not.toBeInTheDocument();
  });

  it("exposes the stable extension ZIP download and installation view", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalog }));
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: "The AmagiFlix" });
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    await user.click(screen.getByRole("button", { name: /Browser Extension/ }));
    expect(screen.getByRole("link", { name: /Download Extension ZIP/ })).toHaveAttribute("href", "/downloads/amagiflix-companion.zip");
    expect(screen.getByText(/chrome:\/\/extensions/)).toBeInTheDocument();
  });

  it("opens a show once with Season 1 episodes and persists show-level My List", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalogWithShow }));
    const user = userEvent.setup();
    renderApp();
    const cards = await screen.findAllByRole("button", { name: "More information about What If Naruto Left Konoha" });
    expect(within(cards[0]).getByText("Series")).toBeInTheDocument();
    await user.click(cards[0]);
    const dialog = await screen.findByRole("dialog", { name: "What If Naruto Left Konoha" });
    expect(within(dialog).getByRole("heading", { name: "Season 1" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Watch Episode 1 on YouTube" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=epNaruto001");
    await user.click(within(dialog).getByRole("button", { name: "Add show to My List" }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).shows["show-naruto-left"].inMyList).toBe(true);
  });

  it("searches episode copy as one show and places Recommended directly before Naruto subcategories", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalogWithShow }));
    const { unmount } = renderApp();
    const recommended = await screen.findByRole("heading", { name: "Recommended" });
    const narutoGroup = screen.getByRole("heading", { level: 2, name: "Naruto & Boruto" });
    expect(recommended.compareDocumentPosition(narutoGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Full Movie" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Series" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "One-shot" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recently Added Full Movies" })).not.toBeInTheDocument();
    unmount();
    renderApp("/search?q=Sasuke");
    expect((await screen.findAllByRole("button", { name: "More information about What If Naruto Left Konoha" }))).toHaveLength(1);
  });

  it("filters by subcategory on the Movies & Shows page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalogWithShow }));
    const user = userEvent.setup();
    renderApp("/movies?category=naruto");
    expect(await screen.findByRole("button", { name: "More information about Naruto Full Movie" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More information about What If Naruto Left Konoha" })).toBeInTheDocument();
    
    // Filter to Series subcategory
    const seriesButton = screen.getByRole("button", { name: "Series" });
    await user.click(seriesButton);
    expect(screen.getByRole("button", { name: "More information about What If Naruto Left Konoha" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More information about Naruto Full Movie" })).not.toBeInTheDocument();

    // Filter to Full Movie subcategory
    const movieButton = screen.getByRole("button", { name: "Full Movie" });
    await user.click(movieButton);
    expect(screen.getByRole("button", { name: "More information about Naruto Full Movie" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More information about What If Naruto Left Konoha" })).not.toBeInTheDocument();
  });

  it("starts on the brand slide and features the newest catalog title with its artwork", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalogWithShow }));
    const user = userEvent.setup();
    renderApp();

    const carousel = await screen.findByRole("region", { name: "Featured carousel" });
    expect(within(carousel).getByRole("heading", { name: "The AmagiFlix" })).toBeInTheDocument();
    expect(within(carousel).queryByRole("heading", { name: "What If Naruto Left Konoha" })).not.toBeInTheDocument();

    await user.click(within(carousel).getByRole("button", { name: "Show newest title: What If Naruto Left Konoha" }));
    expect(within(carousel).getByRole("heading", { name: "What If Naruto Left Konoha" })).toBeInTheDocument();
    expect(within(carousel).getByRole("link", { name: "Play Episode 1" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=epNaruto001");
    expect(carousel.querySelector('[style*="newest-show.jpg"]')).not.toBeNull();
  });
});
