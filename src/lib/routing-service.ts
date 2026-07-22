// Thin database layer around routing.ts's pure functions. All Supabase
// calls live here; the routing decision itself is delegated to
// decideRouting so it stays unit-testable without a database.
//
// Every tag written here (p_routing_tag, p_tags) comes from parseTags/
// getLeftmostTag, whose regex (`[a-zA-Z][a-zA-Z0-9_-]{0,63}`, matches
// lowercased) is structurally identical to the page_tag Postgres domain
// (`^[a-z][a-z0-9_-]{0,63}$`, see supabase/migrations/20260709200542_pages.sql).
// A tag parsed out of note text can therefore never violate that domain
// check -- unlike a standalone user-typed tag (page creation, "[Create
// #tag]"), which needs lib/tag-normalize.ts's explicit validation because
// there's no parser regex standing between the keystroke and the column.

import type { SupabaseClient } from "@supabase/supabase-js";
import { decideRouting, getLeftmostTag, parseTags } from "@/lib/routing";

interface NoteRow {
  id: string;
  workspace_id: string;
  body: string;
  page_id: string | null;
  routing_tag: string | null;
  routing_unmatched: boolean;
}

/**
 * Re-syncs a note's page assignment and note_tags relations from its
 * current body. Called after every note create/edit.
 *
 * The write sequence (notes update + note_tags delete + note_tags insert)
 * runs inside the apply_note_routing Postgres function so it is atomic --
 * a failure partway through cannot leave the note's page assignment and
 * its note_tags relations out of sync.
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
      .is("archived_at", null)
      .maybeSingle();
    matchedPageId = data?.id ?? null;
  }

  const action = decideRouting({
    newLeftmostTag,
    storedRoutingTag: note.routing_tag,
    matchedPageId,
  });

  const target =
    action.type === "unchanged"
      ? { pageId: note.page_id, routingTag: note.routing_tag, routingUnmatched: note.routing_unmatched }
      : action.type === "route_to_page"
        ? { pageId: action.pageId, routingTag: action.routingTag, routingUnmatched: false }
        : action.type === "route_to_inbox_unmatched"
          ? { pageId: null, routingTag: action.routingTag, routingUnmatched: true }
          : { pageId: null, routingTag: null, routingUnmatched: false };

  // note_tags.tag is unique per note, so a repeated tag (e.g. "#foo ... #foo")
  // collapses to a single row keyed on its first occurrence.
  const uniqueTags = [...new Map(tags.map((t) => [t.tag, t.tag])).keys()];

  const { error } = await supabase.rpc("apply_note_routing", {
    p_note_id: note.id,
    p_page_id: target.pageId,
    p_routing_tag: target.routingTag,
    p_routing_unmatched: target.routingUnmatched,
    p_tags: uniqueTags.map((tag) => ({ tag, isRoutingTag: tag === newLeftmostTag })),
  });

  if (error) throw error;
}
