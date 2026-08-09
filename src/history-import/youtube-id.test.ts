import { describe, expect, it } from "vitest";
import { extractYouTubeVideoId, isYouTubeWatchedRecord } from "./youtube-id";

describe("YouTube history recognition", () => {
  it.each([
    "https://www.youtube.com/watch?v=abcDEF12345",
    "https://youtube.com/watch?v=abcDEF12345&list=watch",
    "https://m.youtube.com/watch?v=abcDEF12345",
    "https://youtu.be/abcDEF12345",
  ])("extracts canonical IDs from %s", (url) => expect(extractYouTubeVideoId(url)).toBe("abcDEF12345"));

  it("rejects invalid and unrelated URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/watch?v=abcDEF12345")).toBeUndefined();
    expect(extractYouTubeVideoId("https://youtube.com/watch?v=short")).toBeUndefined();
  });

  it("recognizes English, Portuguese, and structured watch history", () => {
    const url = "https://youtube.com/watch?v=abcDEF12345";
    expect(isYouTubeWatchedRecord({ title: "Watched A", url })).toBe(true);
    expect(isYouTubeWatchedRecord({ title: "Assistiu A", url })).toBe(true);
    expect(isYouTubeWatchedRecord({ title: "A", url, activityControls: ["YouTube watch history"] })).toBe(true);
    expect(isYouTubeWatchedRecord({ title: "Searched for A", url })).toBe(false);
  });
});
