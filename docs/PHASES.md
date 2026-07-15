# PHASES.md — ThoughtDrop

```
version: 1.8
status: exploratory
inputs: SPEC.md v1.11, DESIGN.md v1.0
consumer: implementation agents (phases are sequencing guides, not hard
  scope gates; Bryan may reorder, combine, or add work at any time)
progress:
  - Phase 0: DONE, verified by Bryan on production 2026-07-09
  - Phase 1: DONE (2026-07-09), incl. Phase 1.5 fix list (6/6 items).
    Gemini review triaged (docs/reviews/), 11 migrations replay clean,
    CI green, security advisors at zero — independently verified. Phase 2
    is GO.
  - Design track: DONE. Handoff bundle committed to design/ ("Paper
    Quiet"); page directory screen has no design reference (built from
    tokens; candidate for a later design pass).
  - Phase 2: CODE COMPLETE (2026-07-11), deployed, CI green. Accepted
    deviations: sign-out link in top bar; tag highlight via
    backdrop-overlay.
  - Phase 2 gate failure (2026-07-12): create-page crash on invalid tag
    (no input validation + unhandled throw). Fixed same day with form UX
    rebuild.
  - Gemini Phase 2 review: 5 findings, 4 accepted / 1 rejected (uppercase
    Critical was false — parser lowercases; verified in source).
    Phase 2.5 fix list implemented, race conditions verified via forced
    SQL on a branch, deployed, CI green (2026-07-12).
  - Gate findings (2026-07-13): two fixes before re-run. (1) ⌘N replaced
    with ⌘K everywhere (global handler, Create Note button hint) --
    accepted deviation from the design bundle, which specifies ⌘N. Root
    cause: Chrome reserves ⌘N at the window level ("New Window"); it never
    reaches the page, so the handler was permanently unreachable despite
    passing automated verification (synthetic keydown events bypass
    browser-level reservation entirely). (2) Search stub was styled
    interactive but inert -- now visibly disabled (opacity, cursor,
    tooltip "Search coming soon"), and the "/" focus shortcut is removed
    with it rather than left focusing a dead input.
  - GATE PENDING: Bryan's eight-step manual re-run on production. Phase 3
    opens when it passes.
  - Process rule from Phase 2: future UI verification runs happen on a
    Supabase branch or local stack, never the production project.
  - Process rule from the gate findings: reserved OS/browser shortcuts
    (⌘N, ⌘T, ⌘W, and similar) must be assumed unusable for in-page
    handlers, not verified by testing -- automated keyboard-event dispatch
    does not reproduce browser-level reservation, so a passing automated
    check does not confirm a real keypress reaches the page.
  - Phase 2.75 -- Restyle + colors + pins: CODE COMPLETE (2026-07-14),
    branch-verified, CI green (58 tests). Design source: "Final assembly"
    turn of the Claude Design project referenced in
    docs/briefs/phase2.75-restyle.md, imported via the design MCP (the
    local design/ bundle was stale for this phase). Implements: pages.color
    + pages.pinned_at migrations (with a pin-limit trigger backstop, custom
    SQLSTATE PN005); an 8-hue page-color palette in app code
    (lib/page-colors.ts); TagPill renders in page color everywhere except
    unmatched pills, which stay amber always; note card v2 (header band +
    3px bottom edge) replacing row rendering in the notes drawer and both
    Inbox states, with always-visible footer actions; shelves directory
    replacing the flat page list; pin/unpin + a color swatch picker in the
    page header; pinned-page chips in the top bar after a divider (cap 5,
    "Unpin a page first — 5 max" on the 6th).
    Accepted deviation: no "Suggest tag" button on untagged Inbox cards,
    though the card-v2 mockup shows one -- that feature is Phase 6 (AI tag
    suggestion) and isn't built yet; adding a styled-but-inert button would
    repeat the exact search-stub mistake just fixed in the gate findings.
    Migrations verified on a Supabase branch (advisors clean), then pushed
    to production via `supabase db push --linked --yes` (2026-07-14);
    production security advisors clean.
  - GATE PENDING (Phase 2.75): Bryan's manual re-run covering the Phase 2
    script plus: 3+ page colors with distinct pills everywhere; color
    change propagates live; pin 5 pages, fail cleanly on the 6th, unpin
    one; note cards readable in drawer and Inbox at 1440px and 1280px.
    Phase 3 opens when both this gate and the still-pending Phase 2 gate
    pass.
  - Release hardening (2026-07-15): public Supabase signups disabled and
    the app signup route/action removed because MVP is Bryan-only; CI now
    runs the production build; the pin-limit trigger now takes a
    transaction-scoped advisory lock per workspace before counting, closing
    the concurrent-tab path that could otherwise exceed five pins.
  - Design reset (2026-07-15): Phase 2.9 proposal recorded in
    docs/briefs/phase2.9-design-reset.md. It replaces the "Paper Quiet"
    visual direction with "Studio Desk" while preserving the MVP's capture
    and routing behavior. It is a visual/interaction pass, not a feature
    expansion, and must ship before the combined Phase 2 / 2.75 gate re-run.
  - Information architecture decision (2026-07-15): the app's primary order
    is Today, Inbox, Tasks, Pages. Pages is an expandable sidebar collection
    with pinned pages ordered first. Today may use current real data in Phase
    2.9; Phase 4 extends it rather than replacing it.
  - Product mode decision (2026-07-15): MVP compliance is removed. The app
    is an exploratory fun project; original non-goals and phase order inform
    sequencing but do not prohibit work. Functional verification remains
    required for changed flows, while manual gates are useful feedback rather
    than blockers for the next idea.
  - Task view foundation (2026-07-15): global task creation and inline task
    editing are implemented from the existing tasks table: status, priority,
    due date, title, and delete. Task-list blocks and Inbox task rendering
    remain separate follow-up work.
  - Focused Ledger visual direction (2026-07-15): Bryan selected the
    competitor-informed Focused Ledger study over Studio Desk. Implemented a
    shared light/dark token system and persisted theme control; converted the
    rail, capture surface, notes, Inbox, pages, and global tasks into the
    denser ledger language. Notes now retain context and actions in contained
    cards, while tasks use open/completed lists rather than a default board.
  - Ledger correction (2026-07-15): replace the oversized capture panel with
    a compact writing surface; remove generic note-card boxing in favor of a
    low-chrome paper treatment; build the sidebar from real `parent_id`
    hierarchy with per-parent collapse controls; add an explicit New page
    action; increase light-theme page color contrast.
  - Pin interaction correction (2026-07-15): page pins now populate a visible
    quick-access section above the sidebar tree. The ambiguous Manage action
    is removed in favor of an explicit New page action. Notes gain a
    `pinned_at` migration, Pin/Unpin actions, pinned-first Page and Inbox
    ordering, and a pinned state label.
  - Brand direction (2026-07-15): ThoughtDrop adopts a bespoke, compact owl
    mark in the sidebar. It captures the quiet thinking-companion feeling
    without using the Codex companion artwork as product branding.
  - Visual follow-up (2026-07-15): Bryan confirmed the current owl is only a
    first-pass mark; develop a more distinctive, polished ThoughtDrop logo in
    the next brand pass. The Capture modal still shows a static orange frame
    around the writing area in both themes. Remove that frame entirely and
    retain only a quiet, neutral writing surface; the earlier focus-outline
    change did not address this separate border.
```

## Architect defaults (binding unless Bryan overrides)

- **Stack**: Next.js (App Router) + TypeScript + Tailwind, Supabase (auth + Postgres + RLS), Vercel deploy, GitHub repo.
- **AI provider (SPEC open question 1)**: Anthropic API, cheapest available model tier, on-demand only (user clicks to request a suggestion). Confirm at Phase 6 start.
- **Workspace foundation**: every content table carries `workspace_id` and
  RLS scopes by workspace membership. The current product is single-user, but
  collaboration and team UI are available future directions when desired.

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

## Phase 2.9 — Product shell and visual reset

**Goal**: make the completed capture loop feel like a contemporary personal
thinking workspace before more capability is added.

1. Implement the Focused Ledger app shell: compact/expandable left rail,
   one persistent Capture action, ordered Today → Inbox → Tasks → Pages,
   Inbox count, and an expandable Pages collection with pinned pages first.
   Use a consistent light/dark token system and a persisted appearance
   control. Remove the disabled Search control until Phase 5 ships it.
2. Establish the ledger type scale and restrained component language; restyle
   the capture composer, Inbox, page header, visible notes stream, page
   directory, and global task view. Keep every Phase 2 and 2.75 behavior and
   server action intact.
3. Build Today only from real existing data: Inbox count, open tasks, recent
   notes, and pinned pages. Do not add task creation/lifecycle, blocks, AI,
   search, mobile layouts, or other new features in this phase. Phase 4
   extends Today with the complete task view and recently visited pages.
4. Run the combined Phase 2 / 2.75 manual functional gate after the restyle,
   then visual QA at 1440×900 and 1280×800 with representative data.

**Verify**: capture is the first obvious action on every screen; an existing
page opens with notes visibly present; navigation remains clear and unbroken
at 1280px; all existing functional gate steps pass.

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
4. Extend the Today screen with upcoming tasks, untriaged Inbox count, and
   recently visited pages (story 10).

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
- Convert a note into a task (new story; touches task model).
- (Pinned pages moved INTO MVP scope at SPEC v1.6, 2026-07-13.)
- Everything in SPEC.md non-goals.
