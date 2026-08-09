import { describe, expect, it } from "vitest";
import { normalizeCatalogDescription, SUBSCRIBE_DESCRIPTION_MARKER } from "./description";

describe("catalog description normalization", () => {
  it("keeps only the editorial copy between the subscription link and footer", () => {
    const raw = `Ignored title Be Sure To Subscribe: ${SUBSCRIBE_DESCRIPTION_MARKER}\nThe actual description starts here.\nIt continues here. *** FOLLOW ME WEBSITE: https://example.com *** CREDITS`;
    expect(normalizeCatalogDescription(raw)).toBe("The actual description starts here. It continues here.");
  });

  it("preserves normalized original copy when either boundary is absent", () => {
    expect(normalizeCatalogDescription("  A description without the marker.\nStill useful. ")).toBe("A description without the marker. Still useful.");
    expect(normalizeCatalogDescription(`Title ${SUBSCRIBE_DESCRIPTION_MARKER} Description without a footer.`)).toBe(`Title ${SUBSCRIBE_DESCRIPTION_MARKER} Description without a footer.`);
  });

  it("preserves the original when the bounded section is empty", () => {
    const raw = `Title ${SUBSCRIBE_DESCRIPTION_MARKER} *** FOLLOW ME`;
    expect(normalizeCatalogDescription(raw)).toBe(raw);
  });
});
