"use server";

import { revalidatePath } from "next/cache";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { routeNote } from "@/lib/routing-service";
import { authenticatedAction } from "@/lib/actions/authenticated-action";

export type NoteActionResult = { ok: true } | { ok: false; error: string };

export const createNote = authenticatedAction(async ({ supabase }, body: string): Promise<NoteActionResult> => {
  const trimmed = body.trim();
  if (!trimmed) return { ok: true };

  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { data: note, error } = await supabase
    .from("notes")
    .insert({ workspace_id: workspaceId, body: trimmed })
    .select("id, workspace_id, body, page_id, routing_tag, routing_unmatched")
    .single();

  if (error) throw error;

  await routeNote(supabase, note);
  revalidatePath("/", "layout");
  return { ok: true };
});

export const updateNote = authenticatedAction(
  async ({ supabase }, noteId: string, body: string): Promise<NoteActionResult> => {
    const trimmed = body.trim();
    if (!trimmed) return { ok: true };

    // Chain select onto the update itself instead of fetching first: two
    // round trips means the note (or the page it was on) can change between
    // them, and routeNote would then compute its decision against stale
    // page_id/routing_tag/routing_unmatched. One round trip, no window.
    const { data: updated, error: updateError } = await supabase
      .from("notes")
      .update({ body: trimmed })
      .eq("id", noteId)
      .select("id, workspace_id, body, page_id, routing_tag, routing_unmatched")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updated) return { ok: false, error: "Note not found." };

    await routeNote(supabase, updated);
    revalidatePath("/", "layout");
    return { ok: true };
  }
);

export const deleteNote = authenticatedAction(async ({ supabase }, noteId: string): Promise<NoteActionResult> => {
  const { error } = await supabase.from("notes").delete().eq("id", noteId);
  if (error) throw error;
  revalidatePath("/", "layout");
  return { ok: true };
});
