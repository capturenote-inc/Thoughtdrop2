import { describe, expect, it } from "vitest";
import { authFailure, AUTH_ERROR } from "@/lib/actions/auth-failure";

describe("authFailure", () => {
  it("returns null (proceed) for a present user id", () => {
    expect(authFailure("user-123")).toBeNull();
  });

  it("returns a structured error for a missing user id", () => {
    expect(authFailure(undefined)).toEqual({ ok: false, error: AUTH_ERROR });
    expect(authFailure(null)).toEqual({ ok: false, error: AUTH_ERROR });
  });

  it("returns a structured error for an empty string id", () => {
    expect(authFailure("")).toEqual({ ok: false, error: AUTH_ERROR });
  });
});
