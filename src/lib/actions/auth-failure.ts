// Pure decision function, deliberately separate from authenticated-action.ts:
// that file imports "server-only", whose real implementation throws
// unconditionally outside Next.js's bundler (which specially swaps its
// contents per-graph at build time) -- it would throw in a plain Vitest/Node
// run, not just a browser one. Keeping the decision logic here, with no
// server-only or Supabase import, is what makes it unit-testable.

export const AUTH_ERROR = "You must be logged in.";

/** The auth-failure result for a resolved user id, or null to proceed. */
export function authFailure(userId: string | null | undefined): { ok: false; error: string } | null {
  return userId ? null : { ok: false, error: AUTH_ERROR };
}
