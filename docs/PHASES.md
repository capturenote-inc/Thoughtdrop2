# PHASES.md — ThoughtDrop MVP

```
version: 1.1
status: approved
inputs: SPEC.md v1.4, DESIGN.md v1.0
consumer: Claude Code (one phase per brief; do not start a phase until the
  previous phase's verification passes)
progress:
  - Phase 0: DONE, verified by Bryan on production 2026-07-09
  - Phase 1: DONE (2026-07-09), incl. Phase 1.5 fix list (6/6 items).
    Gemini review triaged (docs/reviews/), 11 migrations replay clean,
    CI green, security advisors at zero — independently verified. Phase 2
    is GO.
  - Parallel: Claude Design session for the four surfaces (page view, top
    bar, Inbox, capture modal); handoff bundle feeds Phase 2/3 briefs.
```

## Architect defaults (binding unless Bryan overrides)

- **Stack**: Next.js (App Router) + TypeScript + Tailwind, Supabase (auth + Postgres + RLS), Vercel deploy, GitHub repo.
- **AI provider (SPEC open question 1)**: Anthropic API, cheapest available model tier, on-demand only (user clicks to request a suggestion). Confirm at Phase 6 start.
- **Team-readiness**: every content table carries `workspace_id` from day one; RLS policies scope by workspace membership. One workspace, one member in MVP. No team UI.

## Phase 0 — Scaffold, auth, deploy

**Goal**: an empty authenticated app running in production.

1. Create GitHub repo, Next.js + TypeScript + Tailwind scaffold.
2. Create Supabase project; wire env vars locally and on Vercel.
3. Supabase email/password auth; single account (Bryan). All routes behind auth except login.
4. Vercel deployment from `main`; production URL live.

**Verify**: log in on the production URL, see an empty authenticated shell. Unauthenticated access redirects to login.

## Phase 1 — Schema and routing engine

**Goal**: the full data model and a fully tested routing core, no UI.

1. Migrations for: `workspaces`, `workspace_members`, `pages` (with `parent_id`, `tag` unique per workspace, max depth 3 enforced), `notes`, `note_tags` (many-to-many, `is_routing_tag` marker), `tasks` (due date, priority, status), `blocks` (type: rich_text | task_list | table; column index), `page_layouts` (column count 2–4, width ratios).
2. RLS policies on all tables, scoped by workspace membership.
3. Tag parser in `lib/routing.ts` implementing SPEC tag syntax exactly: `#[a-zA-Z][a-zA-Z0-9_-]{0,63}`, preceded by start-of-text or whitespace, case-insensitive, stored lowercase.
4. Routing service implementing SPEC routing rules: leftmost tag routes; re-evaluate only when parsed leftmost tag differs from stored routing tag string; unmatched or absent tag → Inbox; page delete → notes to Inbox flagged unmatched, tag freed, no auto-re-route on tag reuse; tag rename keeps routed notes.
5. Unit tests covering: parser edge cases (position 0, mid-word, URL fragment, case, length bounds), first-tag-wins, re-route trigger (changed vs unchanged tag string), rename, delete, freed-tag reuse.

**Verify**: all unit tests pass in CI; migrations apply cleanly to a fresh database.

## Phase 2 — Core capture loop

**Goal**: capture, route, and triage notes end to end. After this phase the app is minimally daily-drivable for notes.

1. Top bar: logo/home, page directory, global task view (stub link), Inbox with untriaged count badge, search (stub), Create Note button (always visible).
2. Create Note modal from any screen: type text, save, routing runs (story 1).
3. Page shell: title, **notes drawer** per DESIGN D1 (full-width collapsible below header, "Notes (N)" collapsed bar, newest-first rows, edit/delete per row, session-only open state). Column canvas area empty placeholder.
4. Page directory: tree view of pages and nesting, navigate to any page; create page (unique tag, parent selection, 3-level limit) (stories 5, 16).
5. Inbox: list untagged and unmatched notes; inline triage per DESIGN D2 ([Create #tag] creates page and routes note; [Fix tag] opens editor focused on tag). Untagged notes are plain rows (stories 3, 4).
6. Note edit and delete everywhere a note renders; editing re-runs routing per SPEC rules (stories 13, 14, 15).

**Verify**: manual script — capture tagged note → appears in target page drawer; capture untagged → Inbox; capture unmatched tag → Inbox with triage actions; Create #tag routes it; edit a note's tag → re-routes; delete works from page and Inbox.

## Phase 3 — Page composition

**Goal**: wide-canvas pages with columns and non-task blocks.

1. Column canvas per page: 2–4 columns, add/remove column, drag-resize with widths persisted server-side as ratios (story 6). Fluid-shrink per DESIGN D3: canvas 100% viewport width, proportional shrink, no horizontal scroll.
2. Rich text block (basic formatting: bold, italic, headings, lists).
3. Simple table block (add/remove rows and columns, plain text cells).
4. Block create, delete, and reorder within a column.

**Verify**: compose a page with 3 columns, resize, reload → layout persists; narrow the window → proportional shrink, no h-scroll.

## Phase 4 — Tasks, global task view, Home

**Goal**: full task lifecycle and the two aggregate views.

1. Task-list block: create tasks inside it (due date, priority, status todo/doing/done), update in place (stories 7 remainder, 8). Tasks never parse hashtags (SPEC rule).
2. Unassigned tasks: create from Inbox or global task view; live in Inbox.
3. Global task view from top bar: all tasks across pages + Inbox, update status/priority/due inline, delete (stories 9, 14).
4. Home screen: upcoming tasks, untriaged Inbox count, recently visited pages (story 10).

**Verify**: create tasks in a block and in Inbox; walk one task todo → doing → done from the global view; Home shows all three sections correctly.

## Phase 5 — Search

**Goal**: story 11 exactly, nothing more.

1. Top bar search: substring match across note bodies, task titles, page titles. No filters, no ranking. Results grouped by type, click-through to page/Inbox/task view.

**Verify**: search hits a known note, task, and page by substring; no-match returns empty state.

## Phase 6 — AI tag suggestion

**Goal**: story 12. Scheduled last so it can slip without blocking the core loop.

1. Confirm provider default (Anthropic, on-demand) with Bryan before starting.
2. On any untagged Inbox note: "Suggest tag" action → server route calls the model with note text + existing page tags → returns one suggested existing tag (or none).
3. Accept (applies tag, re-routes note) or reject (dismisses) in one action.

**Verify**: suggestion returns an existing page tag for an obviously on-topic note; accept routes it; reject leaves the note untouched.

## Phase 7 — Hardening and test start

**Goal**: pass success criterion 1, then start the 14-day test.

1. Sweep every flow in SPEC success criterion 1 against the blocking-bug definition (data loss, uncorrectable mis-route, auth failure, capture unavailable).
2. Fix all blockers; log non-blockers to a BACKLOG.md.
3. Begin the 14-day daily-driver test: activity ≥12 of 14 days, ≥5 captures on a typical day, zero data loss, zero new content in the old tool.

**Verify**: criterion 1 checklist green; test window started with a recorded start date.

## Post-MVP log

- Persisted "pinned open" notes drawer state (DESIGN D1 tension).
- Move/re-parent existing pages (blocked at DB level in MVP; see
  phase1-fixlist.md item 3).
- Everything in SPEC.md non-goals.
