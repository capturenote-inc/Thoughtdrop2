# Gemini review brief — Phase 1 (schema, RLS, routing engine)

You are performing an adversarial code review of a solo-developer web app
(Next.js + TypeScript, Supabase Postgres). Review **only** these areas; do
not review UI, propose features, or question product decisions:

- `supabase/migrations/` (7 files)
- RLS policies and the `is_workspace_member` helper function
- `src/lib/routing.ts` and `src/lib/routing-service.ts`
- The unit tests for routing
- `.github/workflows/ci.yml`

The routing code must implement this contract exactly (from the approved
spec):

1. Tag syntax: `#[a-zA-Z][a-zA-Z0-9_-]{0,63}`, preceded by start-of-text or
   whitespace; mid-word and URL-fragment occurrences are not tags; matching
   case-insensitive; tags stored lowercase.
2. The routing tag is the leftmost hashtag in the note body. Data model
   stores all tags many-to-many with the routing tag marked.
3. Re-route trigger: on save, parse the leftmost tag and compare to the
   note's *stored routing tag string*; re-evaluate routing **only if they
   differ**. Unchanged string = unchanged assignment, even if the tag no
   longer matches any page.
4. Unmatched or absent routing tag on re-evaluation → Inbox. Page delete →
   its notes to Inbox flagged unmatched, tag freed; recreating a freed tag
   does **not** auto-re-route flagged notes. Tag rename keeps already-routed
   notes.

Attack it on these fronts, in priority order:

1. **RLS correctness**: for each table, can any authenticated user read or
   write a row in a workspace they don't belong to? Check
   INSERT/UPDATE/DELETE policies separately from SELECT — missing WITH CHECK
   clauses especially. Check the SECURITY DEFINER helper for search_path
   pinning and API exposure.
2. **Spec conformance**: diff the routing implementation against the four
   contract rules above. Flag any divergence, however small, including regex
   anchoring and case handling.
3. **Trigger integrity**: the 3-level depth cap and per-workspace tag
   uniqueness are trigger-enforced. Find race conditions (concurrent
   inserts), bypass paths (UPDATE that re-parents a page past the cap), and
   missing constraint backstops.
4. **Test gaps**: which contract rules or RLS behaviors have no test? Name
   the missing cases specifically.
5. **Migration replay**: would these 7 migrations apply cleanly to an empty
   database in order? Flag ordering hazards or statements that depend on
   dashboard-only state.

Rules: number every finding, rate Critical / Major / Minor, cite exact file
and line, propose the cheapest fix. No praise, no summaries of what the code
does. If an area is clean, one line saying so.

Write your findings to `docs/reviews/phase1-gemini-findings.md`. Do not
modify any other file in the repository.
