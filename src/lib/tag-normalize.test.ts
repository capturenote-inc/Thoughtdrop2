import { describe, expect, it } from "vitest";
import { isValidTag, normalizeTagInput } from "@/lib/tag-normalize";

describe("normalizeTagInput", () => {
  it("trims whitespace", () => {
    expect(normalizeTagInput("  marketing  ")).toBe("marketing");
  });

  it("strips exactly one leading '#'", () => {
    expect(normalizeTagInput("#marketing")).toBe("marketing");
    expect(normalizeTagInput("##marketing")).toBe("#marketing");
  });

  it("lowercases", () => {
    expect(normalizeTagInput("Marketing")).toBe("marketing");
    expect(normalizeTagInput("MARKETING")).toBe("marketing");
  });

  it("combines trim, strip, and lowercase", () => {
    expect(normalizeTagInput("  #Marketing  ")).toBe("marketing");
  });

  it("does not strip a '#' that isn't leading", () => {
    expect(normalizeTagInput("mark#eting")).toBe("mark#eting");
  });

  it("never throws on empty or malformed input", () => {
    expect(normalizeTagInput("")).toBe("");
    expect(normalizeTagInput("   ")).toBe("");
    expect(normalizeTagInput("#")).toBe("");
  });
});

describe("isValidTag", () => {
  it("accepts a well-formed tag", () => {
    expect(isValidTag("marketing")).toBe(true);
  });

  it("accepts digits, underscores, and hyphens after the first letter", () => {
    expect(isValidTag("q3-launch_v2")).toBe(true);
  });

  it("rejects a tag starting with a digit", () => {
    expect(isValidTag("9tag")).toBe(false);
  });

  it("rejects a tag containing a space", () => {
    expect(isValidTag("mark eting")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidTag("")).toBe(false);
  });

  it("rejects uppercase (normalizeTagInput should run first)", () => {
    expect(isValidTag("Marketing")).toBe(false);
  });

  it("rejects a leading '#' (normalizeTagInput should run first)", () => {
    expect(isValidTag("#marketing")).toBe(false);
  });

  it("accepts a 64-character tag (maximum length)", () => {
    const tag = "a" + "b".repeat(63);
    expect(tag).toHaveLength(64);
    expect(isValidTag(tag)).toBe(true);
  });

  it("rejects a 65-character tag (over maximum length)", () => {
    const tag = "a" + "b".repeat(64);
    expect(tag).toHaveLength(65);
    expect(isValidTag(tag)).toBe(false);
  });
});
