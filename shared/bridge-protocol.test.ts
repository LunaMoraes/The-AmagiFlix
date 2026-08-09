import { describe, expect, it } from "vitest";
import { isWebToExtensionMessage } from "./bridge-protocol";

const base = { protocolVersion: 1, requestId: "request" };

describe("extension bridge protocol validation", () => {
  it("accepts explicit valid operations", () => expect(isWebToExtensionMessage({ ...base, type: "AMAGIFLIX_SET_MANUAL_WATCHED", videoId: "abcDEF12345", watched: true, changedAt: "2026-01-01T00:00:00Z" })).toBe(true));
  it("rejects unknown operations and malformed IDs", () => {
    expect(isWebToExtensionMessage({ ...base, type: "READ_ARBITRARY_STORAGE" })).toBe(false);
    expect(isWebToExtensionMessage({ ...base, type: "AMAGIFLIX_RESET_PROGRESS", videoId: "short" })).toBe(false);
  });
});
