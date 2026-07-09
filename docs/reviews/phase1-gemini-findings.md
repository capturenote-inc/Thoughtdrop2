# Gemini review findings — Phase 1 (verbatim) + triage

Triage outcome: all five accepted. Severity adjusted on #1 (Blocker→Major,
single-user exploitability) ; remedy replaced on #1 (forbid re-parenting
instead of cascading depth recalc); #2 extended to all child-table FKs.
Consolidated into docs/reviews/phase1-fixlist.md together with the two open
Supabase advisor items.

---

1. Blocker | supabase/migrations/20260709200542_pages.sql (Lines 29-33)
The pages_set_depth_and_validate trigger updates new.depth for the
immediately modified row but does not cascade depth changes to descendants.
If a user updates a page's parent_id to move an existing sub-tree, the
descendants' depths remain untouched. This silently bypasses the 3-level
depth cap and permanently corrupts the hierarchy state. Fix: Add an AFTER
UPDATE trigger or a recursive CTE check that propagates depth changes to
children and aborts if any descendant exceeds the depth limit.

2. Blocker | supabase/migrations/20260709200543_notes.sql (Line 4)
The page_id foreign key lacks workspace scoping (references pages (id)). A
malicious client can pass a page_id of a page in a different workspace,
successfully attaching their note to a foreign page. The RLS policy on
notes does not catch this because it only validates the note's own
workspace_id. Fix: Add a UNIQUE (id, workspace_id) constraint to pages and
change the foreign key to FOREIGN KEY (page_id, workspace_id) REFERENCES
pages (id, workspace_id). (Apply the same composite constraint to note_tags
on line 29).

3. Should-fix | src/lib/routing-service.ts (Lines 40-59)
routeNote executes three sequential REST calls (update notes, delete
note_tags, insert note_tags). A network or validation failure on the second
or third call will leave the database in a partially updated, inconsistent
state (e.g., a note with an updated routing_tag but missing relational
note_tags), violating the data model constraints. Fix: Push this write
sequence into a Postgres RPC so it executes inside a single atomic
transaction.

4. Note | src/lib/routing.test.ts (Line 31)
Missing test coverage for the spec rule requiring tags to be "preceded by
start-of-text or whitespace." The regex correctly handles this via a
lookbehind (?<=\s), but there are no tests ensuring that a tag directly
attached to punctuation (e.g., hello.#tag) correctly fails to parse. Fix:
Add an explicit assertion for punctuation-prefixed tags to prevent future
regressions.

5. Note | supabase/migrations/20260709200546_rls_policies.sql (Line 4)
The is_workspace_member security definer function implicitly relies on
user_id = auth.uid() failing when auth.uid() evaluates to null (e.g.,
unauthenticated public access). Fix: Add an explicit
if auth.uid() is null then return false; check before executing the table
lookup as a defense-in-depth measure for security definer logic.
