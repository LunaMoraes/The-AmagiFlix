import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
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

const renderApp = () => render(<MemoryRouter initialEntries={["/"]}><ExtensionBridgeProvider><HistoryImportProvider><ProfileProvider><LibraryProvider><App /></LibraryProvider></ProfileProvider></HistoryImportProvider></ExtensionBridgeProvider></MemoryRouter>);

afterEach(() => vi.restoreAllMocks());

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
    await waitFor(() => expect(screen.getByRole("heading", { name: "Naruto Full Movie" })).toBeInTheDocument());
  });

  it("stores the profile name and exposes V2 history settings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => catalog }));
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: "Naruto Full Movie" });
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
    await screen.findByRole("heading", { name: "Naruto Full Movie" });
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    await user.click(screen.getByRole("button", { name: /Browser Extension/ }));
    expect(screen.getByRole("link", { name: /Download Extension ZIP/ })).toHaveAttribute("href", "/downloads/amagiflix-companion.zip");
    expect(screen.getByText(/chrome:\/\/extensions/)).toBeInTheDocument();
  });
});
