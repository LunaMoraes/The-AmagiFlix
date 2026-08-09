import { describe, expect, it } from "vitest";
import { formatDuration, parseIsoDuration } from "./duration";

describe("duration", () => {
  it("parses YouTube ISO durations", () => expect(parseIsoDuration("PT2H4M5S")).toBe(7445));
  it("rejects malformed durations", () => expect(parseIsoDuration("2 hours")).toBeNull());
  it("formats long movies", () => expect(formatDuration(7445)).toBe("2h 4m"));
});
