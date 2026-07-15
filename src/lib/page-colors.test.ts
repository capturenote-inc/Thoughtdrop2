import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_COLOR, PAGE_COLOR_KEYS, PAGE_COLORS, isPageColorKey, resolvePageColor } from "@/lib/page-colors";

describe("isPageColorKey", () => {
  it("accepts every key in the palette", () => {
    for (const key of PAGE_COLOR_KEYS) {
      expect(isPageColorKey(key)).toBe(true);
    }
  });

  it("rejects unknown strings", () => {
    expect(isPageColorKey("turquoise")).toBe(false);
    expect(isPageColorKey("")).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isPageColorKey(null)).toBe(false);
    expect(isPageColorKey(undefined)).toBe(false);
  });
});

describe("resolvePageColor", () => {
  it("passes through a valid key", () => {
    expect(resolvePageColor("teal")).toBe("teal");
  });

  it("falls back to the default for invalid or missing values", () => {
    expect(resolvePageColor("not-a-color")).toBe(DEFAULT_PAGE_COLOR);
    expect(resolvePageColor(null)).toBe(DEFAULT_PAGE_COLOR);
    expect(resolvePageColor(undefined)).toBe(DEFAULT_PAGE_COLOR);
  });
});

describe("PAGE_COLORS", () => {
  it("has a default that resolves to a real palette entry", () => {
    expect(PAGE_COLORS[DEFAULT_PAGE_COLOR]).toBeDefined();
  });

  it("gives every key a tint and ink hex value", () => {
    for (const key of PAGE_COLOR_KEYS) {
      expect(PAGE_COLORS[key].tint).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(PAGE_COLORS[key].ink).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
