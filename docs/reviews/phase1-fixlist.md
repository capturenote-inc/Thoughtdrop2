# Phase 1.5 fix list — post-review (Gemini review + Supabase advisors)

```
status: ready for Claude Code
inputs: docs/reviews/phase1-gemini-findings.md, Supabase security advisors
gate: Phase 2 does not start until every item is done and verified
```

All schema changes ship as new migrations via Supabase CLI. Do not edit
existing migration files.

1. **Move `is_workspace_member` out of the exposed API** (advisor warnings
   + Gemini #5). New migration: create schema `private` (not exposed via
   PostgREST). Recreate the helper as `private.is_workspace_member(uuid)`
   with (a) `search_path` pinned, (b) an explicit
   `if auth.uid() is null then return false; end if;` guard before the
   lookup. Grant EXECUTE to `authenticated`; revoke from `anon` and
   `public`. Update every RLS policy to reference the new schema. Drop the
   public function. Verify: both SECURITY DEFINER advisor warnings clear.

2. **Workspace-scoped composite foreign keys** (Gemini #2, extended). New
   migration: add `UNIQUE (id, workspace_id)` to `pages` and `notes`. Change
   these FKs to composite form `(x_id, workspace_id) REFERENCES parent (id,
   workspace_id)`:
   - `notes.page_id` → pages
   - `note_tags.note_id` → notes
   - `blocks.page_id` → pages
   - `page_layouts.page_id` → pages
   - `tasks` → pages/blocks (whichever references it carries)
   Add a test or SQL verification that inserting a note with a `page_id`
   from a different workspace is rejected by the constraint itself, not
   only by RLS.

3. **Forbid re-parenting pages** (Gemini #1, remedy simplified). New
   migration: trigger on `pages` raising an exception when
   `NEW.parent_id IS DISTINCT FROM OLD.parent_id`. Pages can only receive a
   parent at creation. Remove/adjust any depth-recalculation logic that
   assumed re-parenting. Verify: SQL attempt to change `parent_id` fails.
   ("Move page" logged as post-MVP in PHASES.md.)

4. **Atomic routing writes** (Gemini #3). Move the write sequence in
   `src/lib/routing-service.ts` (`routeNote`: notes update + note_tags
   delete + note_tags insert) into a single Postgres function so it runs in
   one transaction. SECURITY INVOKER so RLS still applies. Update
   `routing-service.ts` to call it via RPC. Keep `src/lib/routing.ts` pure
   and untouched. Verify: existing routing tests still pass; add one test
   that the RPC rejects a cross-workspace `page_id` (overlaps item 2).

5. **Parser boundary tests** (Gemini #4). Add to `src/lib/routing.test.ts`:
   (a) `hello.#tag` parses no tag (punctuation is not a valid boundary);
   (b) `#tag` at position 0 parses. If (b) fails because the boundary
   lookbehind only accepts whitespace, fix the regex to accept
   start-of-text and add the regression test.

6. **Enable leaked-password protection** (advisor). Bryan does this one:
   Supabase dashboard → Authentication → Attack Protection → enable the
   leaked-password (HaveIBeenPwned) check. No code change. Requires Pro
   plan; if on free plan, DEFERRED as accepted risk (single user, own
   password) until team features force an upgrade.

Done criteria: items 1–5 merged to main with CI green; Supabase security
advisors show zero warnings except, if on free plan, the leaked-password
advisory (item 6, deferred); item 6 toggled or deferred.
