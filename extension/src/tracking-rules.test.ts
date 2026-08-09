import { describe, expect, it } from "vitest";
import { COMPLETE_THRESHOLD, isComplete, MIN_MEANINGFUL_WATCH_SECONDS } from "./tracking-rules";

describe("companion tracking rules", () => {
  it("keeps thresholds centralized", () => {
    expect(MIN_MEANINGFUL_WATCH_SECONDS).toBe(30);
    expect(COMPLETE_THRESHOLD).toBe(.9);
  });
  it("treats 89% as incomplete and 90% or ended as complete", () => {
    expect(isComplete(89, 100)).toBe(false);
    expect(isComplete(90, 100)).toBe(true);
    expect(isComplete(1, 100, true)).toBe(true);
  });
});
