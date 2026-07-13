import { describe, expect, it } from "vitest";
import { classifyPgError } from "@/lib/actions/pg-error";

describe("classifyPgError", () => {
  it("classifies 23505 as unique_violation", () => {
    expect(classifyPgError("23505")).toBe("unique_violation");
  });

  it("classifies 23514 as check_violation", () => {
    expect(classifyPgError("23514")).toBe("check_violation");
  });

  it("classifies anything else as unknown", () => {
    expect(classifyPgError("42501")).toBe("unknown");
    expect(classifyPgError("PGRST116")).toBe("unknown");
  });

  it("classifies missing codes as unknown", () => {
    expect(classifyPgError(undefined)).toBe("unknown");
    expect(classifyPgError(null)).toBe("unknown");
  });
});
