"use server";

import { revalidatePath } from "next/cache";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { isValidTag, normalizeTagInput, TAG_DUPLICATE_ERROR, TAG_FORMAT_ERROR } from "@/lib/tag-normalize";
import { classifyPgError } from "@/lib/actions/pg-error";
import { authenticatedAction } from "@/lib/actions/authenticated-action";
import { DEFAULT_PAGE_COLOR, isPageColorKey } from "@/lib/page-colors";

const PIN_LIMIT_ERROR = "Unpin a page first — 5 max";

export interface CreatePageFieldErrors {
  title?: string;
  tag?: string;
}

export type CreatePageResult = { ok: true } | { ok: false; fieldErrors: CreatePageFieldErrors };

/**
 * Never throws for invalid user input (bad tag format, duplicate tag) --
 * only for unexpected failures (workspace resolution, network). A thrown
 * error from a Server Action crashes the calling Server Component's render;
 * user-input validation problems must come back as data instead.
 */
export const createPage = authenticatedAction(
  async (
    { supabase },
    input: { tag: string; title: string; parentId: string | null; color?: string }
  ): Promise<CreatePageResult> => {
    const title = input.title.trim();
    const tag = normalizeTagInput(input.tag);
    // The picker only ever sends a known key; an unrecognized value (a
    // stale client, or a direct call to this action) falls back to the
    // default rather than surfacing a field error over a non-user-facing
    // input.
    const color = isPageColorKey(input.color) ? input.color : DEFAULT_PAGE_COLOR;

    const fieldErrors: CreatePageFieldErrors = {};
    if (!title) fieldErrors.title = "Title is required.";
    if (!tag) fieldErrors.tag = "Tag is required.";
    else if (!isValidTag(tag)) fieldErrors.tag = TAG_FORMAT_ERROR;

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, fieldErrors };
    }

    const workspaceId = await getCurrentWorkspaceId(supabase);

    const { error } = await supabase.from("pages").insert({
      workspace_id: workspaceId,
      tag,
      title,
      parent_id: input.parentId,
      color,
    });

    if (error) {
      const kind = classifyPgError(error.code);
      if (kind === "unique_violation") return { ok: false, fieldErrors: { tag: TAG_DUPLICATE_ERROR } };
      if (kind === "check_violation") return { ok: false, fieldErrors: { tag: TAG_FORMAT_ERROR } };
      throw error;
    }

    revalidatePath("/", "layout");
    return { ok: true };
  }
);

export type CreatePageActionResult = Awaited<ReturnType<typeof createPage>>;

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
 * defense in depth, not a fix for a reachable invalid-format case.
 *
 * A duplicate IS reachable: two unmatched notes can share a tag, and
 * clicking "Create #tag" on both -- racing, or just in quick succession --
 * hits the unique constraint on the second attempt. Rather than fail that
 * second click, recover: look up the page the first click just created and
 * route the note to it. The user's intent ("file this under #tag") is
 * satisfied either way; failing the second note over a timing accident
 * would just make them click the same button again for the same outcome.
 */
export const createPageAndRouteNote = authenticatedAction(
  async ({ supabase }, noteId: string, tag: string): Promise<CreatePageAndRouteResult> => {
    const normalizedTag = normalizeTagInput(tag);

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("workspace_id")
      .eq("id", noteId)
      .maybeSingle();
    if (noteError) throw noteError;
    if (!note) return { ok: false, error: "Note not found." };

    let pageId: string;

    const { data: page, error: pageError } = await supabase
      .from("pages")
      .insert({ workspace_id: note.workspace_id, tag: normalizedTag, title: normalizedTag, parent_id: null })
      .select("id")
      .single();

    if (pageError) {
      const kind = classifyPgError(pageError.code);
      if (kind === "unique_violation") {
        const { data: existingPage, error: lookupError } = await supabase
          .from("pages")
          .select("id")
          .eq("workspace_id", note.workspace_id)
          .eq("tag", normalizedTag)
          .maybeSingle();
        if (lookupError) throw lookupError;
        // The constraint fired because a page with this tag exists, so the
        // lookup should always find it; a miss here means something else is
        // wrong (e.g. RLS hiding a row that shouldn't exist) -- surface the
        // original constraint error rather than paper over it.
        if (!existingPage) throw pageError;
        pageId = existingPage.id;
      } else if (kind === "check_violation") {
        return { ok: false, error: TAG_FORMAT_ERROR };
      } else {
        throw pageError;
      }
    } else {
      pageId = page.id;
    }

    const { data: existingTags, error: tagsError } = await supabase
      .from("note_tags")
      .select("tag, is_routing_tag")
      .eq("note_id", noteId)
      .order("position");
    if (tagsError) throw tagsError;

    const { error: rpcError } = await supabase.rpc("apply_note_routing", {
      p_note_id: noteId,
      p_page_id: pageId,
      p_routing_tag: normalizedTag,
      p_routing_unmatched: false,
      p_tags: (existingTags ?? []).map((t) => ({ tag: t.tag, isRoutingTag: t.is_routing_tag })),
    });
    if (rpcError) throw rpcError;

    revalidatePath("/", "layout");
    return { ok: true };
  }
);

export type CreatePageAndRouteActionResult = Awaited<ReturnType<typeof createPageAndRouteNote>>;

export type PageActionResult = { ok: true } | { ok: false; error: string };

export const setPageColor = authenticatedAction(
  async ({ supabase }, pageId: string, color: string): Promise<PageActionResult> => {
    if (!isPageColorKey(color)) return { ok: false, error: "Not a valid color." };

    const { error } = await supabase.from("pages").update({ color }).eq("id", pageId);
    if (error) throw error;

    revalidatePath("/", "layout");
    return { ok: true };
  }
);

/**
 * Checks the pin count before writing (cheap, avoids the round trip to the
 * DB for the common case) but still relies on the pages_enforce_pin_limit
 * trigger (migration 20260713200158) to catch the race where two pins
 * land between the check and the write -- the check-then-act window here
 * is not atomic on its own.
 */
export const pinPage = authenticatedAction(async ({ supabase }, pageId: string): Promise<PageActionResult> => {
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("workspace_id, pinned_at")
    .eq("id", pageId)
    .maybeSingle();
  if (pageError) throw pageError;
  if (!page) return { ok: false, error: "Page not found." };
  if (page.pinned_at) return { ok: true };

  const { count, error: countError } = await supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", page.workspace_id)
    .not("pinned_at", "is", null);
  if (countError) throw countError;
  if ((count ?? 0) >= 5) return { ok: false, error: PIN_LIMIT_ERROR };

  const { error } = await supabase.from("pages").update({ pinned_at: new Date().toISOString() }).eq("id", pageId);
  if (error) {
    if (classifyPgError(error.code) === "pin_limit") return { ok: false, error: PIN_LIMIT_ERROR };
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
});

export const unpinPage = authenticatedAction(async ({ supabase }, pageId: string): Promise<PageActionResult> => {
  const { error } = await supabase.from("pages").update({ pinned_at: null }).eq("id", pageId);
  if (error) throw error;

  revalidatePath("/", "layout");
  return { ok: true };
});
