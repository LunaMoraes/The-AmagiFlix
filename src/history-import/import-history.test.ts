import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import jsonFixture from "./fixtures/watch-history.json?raw";
import htmlFixture from "./fixtures/watch-history.html?raw";
import { importHistory } from "./import-history";

const catalog = new Set(["abcDEF12345"]);

describe("local history import", () => {
  it("merges duplicate JSON records and preserves timestamps", async () => {
    const result = await importHistory(new File([jsonFixture], "history.json", { type: "application/json" }), catalog, "2026-01-01T00:00:00.000Z");
    expect(result).toMatchObject({ recordsScanned: 4, youtubeWatchedRecords: 3, matchedRecords: 2 });
    expect(result.matches).toEqual([expect.objectContaining({ videoId: "abcDEF12345", importCount: 2, firstKnownWatchedAt: "2024-01-02T03:04:05.000Z", lastKnownWatchedAt: "2025-02-03T04:05:06.000Z" })]);
  });

  it("parses Portuguese watched context from HTML", async () => {
    const result = await importHistory(new File([htmlFixture], "activity.html", { type: "text/html" }), catalog);
    expect(result.matches).toHaveLength(1);
    expect(result.youtubeWatchedRecords).toBe(1);
  });

  it("finds nested supported files in a Takeout ZIP", async () => {
    const archive = zipSync({ "Takeout/My Activity/YouTube/history.json": strToU8(jsonFixture), "archive_browser.html": strToU8("<html></html>") });
    const result = await importHistory(new File([archive], "takeout.zip", { type: "application/zip" }), catalog);
    expect(result.matches[0]).toMatchObject({ videoId: "abcDEF12345", importCount: 2 });
  });

  it("completes a valid import with zero catalog matches", async () => {
    const result = await importHistory(new File([jsonFixture], "history.json"), new Set());
    expect(result.youtubeWatchedRecords).toBe(3);
    expect(result.matches).toEqual([]);
  });

  it("rejects malformed and unsupported files", async () => {
    await expect(importHistory(new File(["{"], "history.json"), catalog)).rejects.toThrow(/malformed/i);
    await expect(importHistory(new File(["nothing"], "history.txt"), catalog)).rejects.toThrow(/JSON, HTML, or ZIP/i);
  });
});
