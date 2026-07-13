import "server-only";
import { createClient } from "@/lib/supabase/server";
import { authFailure } from "@/lib/actions/auth-failure";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthContext {
  supabase: SupabaseClient;
  userId: string;
}

/**
 * Wraps a Server Action so the session is resolved and verified before the
 * wrapped function -- and therefore any database call -- runs. Server
 * Actions are directly invokable POST endpoints reachable by anyone who can
 * send the same request (see Next.js's server-actions guide: "the route is
 * reachable to anyone who can send the same POST"), not just form handlers
 * reached through the authenticated app shell -- this is a backstop
 * independent of proxy.ts's route-level redirect, which only guards page
 * navigations, not action calls.
 *
 * Verified empirically (build + runtime) that Next.js 16.2.10 correctly
 * treats `export const foo = authenticatedAction(async (...) => {})` as a
 * Server Action reference despite the exported value being a call
 * expression rather than a literal function -- this is the kind of thing
 * this Next.js version's docs warn diverges from training data, so it was
 * checked rather than assumed.
 */
export function authenticatedAction<Args extends unknown[], T>(
  fn: (ctx: AuthContext, ...args: Args) => Promise<T>
): (...args: Args) => Promise<T | { ok: false; error: string }> {
  return async (...args: Args) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const failure = authFailure(user?.id);
    if (failure) return failure;

    return fn({ supabase, userId: user!.id }, ...args);
  };
}
