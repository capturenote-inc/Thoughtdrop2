"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { isValidTag, normalizeTagInput, TAG_DUPLICATE_ERROR, TAG_FORMAT_ERROR } from "@/lib/tag-normalize";

// Postgres SQLSTATE codes surfaced by supabase-js as error.code.
const PG_UNIQUE_VIOLATION = "23505";
const PG_CHECK_VIOLATION = "23514";

export interface CreatePageFieldErrors {
  title?: string;
  tag?: string;
}

export type CreatePageResult = { ok: true } | { ok: false; fieldErrors: CreatePageFieldErrors };

/**
 * Never throws for invalid user input (bad tag format, duplicate tag) --
 * only for unexpected failures (auth/workspace resolution, network). A
 * thrown error from a Server Action crashes the calling Server Component's
 * render; user-input validation problems must come back as data instead.
 */
export async function createPage(input: {
  tag: string;
  title: string;
  parentId: string | null;
}): Promise<CreatePageResult> {
  const title = input.title.trim();
  const tag = normalizeTagInput(input.tag);

  const fieldErrors: CreatePageFieldErrors = {};
  if (!title) fieldErrors.title = "Title is required.";
  if (!tag) fieldErrors.tag = "Tag is required.";
  else if (!isValidTag(tag)) fieldErrors.tag = TAG_FORMAT_ERROR;

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { error } = await supabase.from("pages").insert({
    workspace_id: workspaceId,
    tag,
    title,
    parent_id: input.parentId,
  });

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return { ok: false, fieldErrors: { tag: TAG_DUPLICATE_ERROR } };
    }
    if (error.code === PG_CHECK_VIOLATION) {
      return { ok: false, fieldErrors: { tag: TAG_FORMAT_ERROR } };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export type CreatePageAndRouteResult = { ok: true } | { ok: false; error: string };

/**
 * Inbox "[Create #tag]" triage action (DESIGN D2): creates the page owning
 * the tag and routes the note to it immediately. This is a manual, direct
 * assignment -- it deliberately does NOT go through decideRouting/routeNote,
 * since the note's leftmost tag string is unchanged (that's exactly why it
 * was sitting unmatched) and the re-route trigger rule would otherwise
 * correctly leave it alone. It still writes through the atomic RPC so the
 * notes update and note_tags stay consistent.
 *
 * `tag` is always a note's stored routing_tag, which routing.ts's parser
 * already guarantees is page_tag-domain-valid (lowercased, starts with a
 * letter, ASCII letters/digits/_/- only) -- normalizeTagInput here is
 * defense in depth, not a fix for a reachable invalid-format case. A
 * duplicate IS reachable though: two unmatched notes can share a tag, and
 * clicking "Create #tag" on both racing (or in sequence, if the first
 * click's page creation is somehow retried) would hit the unique
 * constraint on the second.
 */
export async function createPageAndRouteNote(noteId: string, tag: string): Promise<CreatePageAndRouteResult> {
  const supabase = await createClient();
  const normalizedTag = normalizeTagInput(tag);

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

  if (pageError) {
    if (pageError.code === PG_UNIQUE_VIOLATION) {
      return { ok: false, error: TAG_DUPLICATE_ERROR };
    }
    if (pageError.code === PG_CHECK_VIOLATION) {
      return { ok: false, error: TAG_FORMAT_ERROR };
    }
    throw pageError;
  }

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
  return { ok: true };
}
