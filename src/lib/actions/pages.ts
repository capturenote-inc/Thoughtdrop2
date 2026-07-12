"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";

export async function createPage(input: { tag: string; title: string; parentId: string | null }): Promise<void> {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { error } = await supabase.from("pages").insert({
    workspace_id: workspaceId,
    tag: input.tag.trim().toLowerCase(),
    title: input.title.trim(),
    parent_id: input.parentId,
  });

  if (error) throw error;
  revalidatePath("/", "layout");
}

/**
 * Inbox "[Create #tag]" triage action (DESIGN D2): creates the page owning
 * the tag and routes the note to it immediately. This is a manual, direct
 * assignment -- it deliberately does NOT go through decideRouting/routeNote,
 * since the note's leftmost tag string is unchanged (that's exactly why it
 * was sitting unmatched) and the re-route trigger rule would otherwise
 * correctly leave it alone. It still writes through the atomic RPC so the
 * notes update and note_tags stay consistent.
 */
export async function createPageAndRouteNote(noteId: string, tag: string): Promise<void> {
  const supabase = await createClient();
  const normalizedTag = tag.trim().toLowerCase();

  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("workspace_id")
    .eq("id", noteId)
    .single();
  if (noteError) throw noteError;

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .insert({ workspace_id: note.workspace_id, tag: normalizedTag, title: normalizedTag, parent_id: null })
    .select("id")
    .single();
  if (pageError) throw pageError;

  const { data: existingTags, error: tagsError } = await supabase
    .from("note_tags")
    .select("tag, is_routing_tag")
    .eq("note_id", noteId)
    .order("position");
  if (tagsError) throw tagsError;

  const { error: rpcError } = await supabase.rpc("apply_note_routing", {
    p_note_id: noteId,
    p_page_id: page.id,
    p_routing_tag: normalizedTag,
    p_routing_unmatched: false,
    p_tags: (existingTags ?? []).map((t) => ({ tag: t.tag, isRoutingTag: t.is_routing_tag })),
  });
  if (rpcError) throw rpcError;

  revalidatePath("/", "layout");
}
