# Gemini review brief — Phase 2 (server actions and client-input paths)

You are performing an adversarial code review of a solo-developer web app
(Next.js App Router + TypeScript, Supabase Postgres with RLS). Phase 2
added the UI and Server Actions. Review **only** the server-side input
paths; do not review visual styling, CSS, or product decisions:

- All Server Actions (`src/**/actions*.ts`, `src/lib/notes.ts`,
  `src/lib/pages*.ts` or wherever actions live — locate them all)
- `src/lib/tag-normalize.ts`
- `src/lib/routing-service.ts` call sites (the routing engine itself was
  reviewed in Phase 1 — only its invocation from actions is in scope)
- Auth/session handling in the actions and route protection

Known context: a production crash was already found and fixed — createPage
lacked input validation and let a Postgres domain-check violation throw out
of the action, crashing the RSC render. Assume this pattern may recur
elsewhere. The author audited the remaining actions and claims no other
crash path exists because the note-tag parser grammar is identical to the
DB domain. Treat that claim as unverified.

Attack, in priority order:

1. **Unhandled-throw paths**: for every action, enumerate every input a
   user (or a stale/concurrent client) can send that reaches the database
   and produces an error the action does not catch: constraint violations,
   RLS denials returning empty results treated as success, missing rows on
   edit/delete of a just-deleted note, double-submits. Verify the author's
   "unreachable case" claim about the notes paths specifically.
2. **Authorization assumptions**: Server Actions are directly invokable
   endpoints, not just form handlers. For each action, can it be called
   with IDs the user's UI would never produce (another workspace's page_id
   or note_id)? Confirm every action relies on RLS or explicit checks, not
   on the UI only sending valid IDs.
3. **Validation symmetry**: client-side and server-side validation must
   enforce the same rules. Flag any rule enforced only client-side.
4. **Session handling**: any action or data fetch reachable without a
   valid session; cache/revalidation mistakes that could leak one user's
   data into another's render (relevant for team-readiness).
5. **Race conditions**: two tabs, stale lists, concurrent triage of the
   same Inbox note, [Create #tag] for a tag created moments earlier.

Rules: number every finding, rate Critical / Major / Minor, cite exact
file and line, propose the cheapest fix. No praise, no code-tour summaries.
If an area is clean, one line saying so.
