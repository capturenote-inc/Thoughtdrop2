# Phase 2 fix list — post-Gemini review

```
status: ready for Claude Code
inputs: Gemini Phase 2 review (5 findings: 1 rejected, 4 accepted)
gate: Phase 3 does not start until these are done and Bryan's manual gate
  re-run has passed
rejected: Gemini #1 (uppercase tags crash the RPC) — false; routeNote
  derives all tags from parseTags, which lowercases every match (tested).
  No code change.
```

1. **Replace crash-prone `.single()` fetches** (Gemini #2, Major). In
   `src/lib/actions/notes.ts` (~line 29) and `src/lib/actions/pages.ts`
   (~line 72), and anywhere else an action fetches a row a concurrent
   client could have deleted or RLS could hide: use `.maybeSingle()`,
   check for null, return a structured error ("Note not found") instead
   of letting `PGRST116` throw into the RSC render.

2. **Eliminate the read-modify-write race in `updateNote`** (Gemini #3,
   Major). Drop the initial fetch; chain `.select("id, workspace_id,
   page_id, routing_tag, routing_unmatched")` (plus body) onto the update
   itself and pass the returned row to `routeNote`. One round trip,
   no stale state. `.maybeSingle()` per item 1 on the result.

3. **Recover instead of erroring on concurrent page creation in
   [Create #tag]** (Gemini #4, Minor). In `createPageAndRouteNote`, on
   unique-violation (23505): query the existing page id by tag and proceed
   with the `apply_note_routing` RPC as if creation had succeeded. Keep
   the inline error only for genuinely unexpected failures.

4. **`authenticatedAction` wrapper** (Gemini #5, Minor). Higher-order
   function around every exported Server Action: resolve the session
   first; if absent, return a structured auth error before any database
   call. Apply to all actions in `notes.ts`, `pages.ts`, and any others.

5. Verification: unit tests where pure (wrapper, recovery logic); manual
   checks on a Supabase branch or local stack, never production. CI green.
