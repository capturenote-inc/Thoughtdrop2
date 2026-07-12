import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * MVP is one workspace per user (SPEC: "One workspace, one member in MVP").
 * The auto-provisioning trigger from Phase 1 guarantees every auth user has
 * exactly one workspace_members row, so this always resolves.
 */
export async function getCurrentWorkspaceId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.from("workspace_members").select("workspace_id").limit(1).single();

  if (error || !data) {
    throw new Error("No workspace found for the current user");
  }

  return data.workspace_id;
}
