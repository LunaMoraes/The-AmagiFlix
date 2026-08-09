import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { LibraryProvider } from "./context/LibraryContext";
import { STORAGE_KEY } from "./config/app";

const catalog = {
  schemaVersion: 1,
  generatedAt: "2026-01-01T00:00:00Z",
  sourceChannelId: "test",
  movieCount: 1,
  movies: [{ videoId: "movie-1", title: "Naruto Full Movie", description: "A complete hero story.", publishedAt: "2026-01-01T00:00:00Z", durationSeconds: 7200, thumbnails: {}, categories: ["naruto"] }],
};

const renderApp = () => render(<MemoryRouter initialEntries={["/"]}><LibraryProvider><App /></LibraryProvider></MemoryRouter>);

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
    expect(stored.videos["movie-1"].startedAt).toEqual(expect.any(String));
    expect(watch).toHaveAttribute("href", "https://www.youtube.com/watch?v=movie-1");
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
});
