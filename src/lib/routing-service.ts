// Thin database layer around routing.ts's pure functions. All Supabase
// calls live here; the routing decision itself is delegated to
// decideRouting so it stays unit-testable without a database.

import type { SupabaseClient } from "@supabase/supabase-js";
import { decideRouting, getLeftmostTag, parseTags } from "@/lib/routing";

interface NoteRow {
  id: string;
  workspace_id: string;
  body: string;
  routing_tag: string | null;
}

/**
 * Re-syncs a note's page assignment and note_tags relations from its
 * current body. Called after every note create/edit.
 */
export async function routeNote(supabase: SupabaseClient, note: NoteRow): Promise<void> {
  const tags = parseTags(note.body);
  const newLeftmostTag = getLeftmostTag(note.body);

  let matchedPageId: string | null = null;
  if (newLeftmostTag !== null) {
    const { data } = await supabase
      .from("pages")
      .select("id")
      .eq("workspace_id", note.workspace_id)
      .eq("tag", newLeftmostTag)
      .maybeSingle();
    matchedPageId = data?.id ?? null;
  }

  const action = decideRouting({
    newLeftmostTag,
    storedRoutingTag: note.routing_tag,
    matchedPageId,
  });

  if (action.type !== "unchanged") {
    const update =
      action.type === "route_to_page"
        ? { page_id: action.pageId, routing_tag: action.routingTag, routing_unmatched: false }
        : action.type === "route_to_inbox_unmatched"
          ? { page_id: null, routing_tag: action.routingTag, routing_unmatched: true }
          : { page_id: null, routing_tag: null, routing_unmatched: false };

    const { error } = await supabase.from("notes").update(update).eq("id", note.id);
    if (error) throw error;
  }

  // note_tags always reflects the note's current body, independent of
  // whether the routing decision above changed anything (SPEC: "all tags
  // on a note are stored as relations").
  const { error: deleteError } = await supabase.from("note_tags").delete().eq("note_id", note.id);
  if (deleteError) throw deleteError;

  // note_tags.tag is unique per note, so a repeated tag (e.g. "#foo ... #foo")
  // collapses to a single row keyed on its first occurrence.
  const uniqueTags = [...new Map(tags.map((t) => [t.tag, t.tag])).keys()];

  if (uniqueTags.length > 0) {
    const rows = uniqueTags.map((tag, position) => ({
      workspace_id: note.workspace_id,
      note_id: note.id,
      tag,
      is_routing_tag: tag === newLeftmostTag,
      position,
    }));
    const { error: insertError } = await supabase.from("note_tags").insert(rows);
    if (insertError) throw insertError;
  }
}
