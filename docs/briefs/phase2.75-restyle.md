# Phase 2.75 brief — Restyle + colors + pins

```
status: ready for Claude Code
inputs: SPEC.md v1.6, design iteration 2 (Claude Design project import)
position: between Phase 2 and Phase 3. Phase 3 does not start until this
  ships and Bryan's full gate re-run passes.
```

## Design import

Use the claude_design MCP (https://api.anthropic.com/v1/design/mcp, auth
via /design-login) to import this project:
https://claude.ai/design/p/cfc346ae-0da5-4841-a8ff-dc3217e046f8?file=ThoughtDrop+Explorations.dc.html

Authoritative turns:
- **"Final assembly — pinned pages in the top bar (max 5), shelves
  directory, card v2 in place"** is the source of truth for every surface
  this phase touches.
- **"Dashboard" / "Dashboard v2" turns: DO NOT BUILD.** They are the
  design reference for Phase 4's Home screen. Park them.
- Earlier turns (iteration, alternatives, and both round-1 turns) are
  history; consult only where the final assembly is ambiguous.

Conflict rules unchanged: bundle wins on visuals, docs/SPEC.md v1.6 +
docs/DESIGN.md win on behavior.

## Items

1. **Migration: `pages.color`** — text column holding a palette key (the
   palette lives in app code so hues can tune without data changes),
   NOT NULL DEFAULT 'amber'. Palette keys/values from the design bundle.
2. **Migration: `pages.pinned_at`** — timestamptz NULL. Pinned = non-null;
   top-bar order by pinned_at (per design). Max 5 enforced in the action
   with a structured error ("Unpin a page first — 5 max"); add a DB
   trigger backstop if cheap.
3. **Note cards** replace row rendering everywhere notes render: page
   drawer (expanded state) and both Inbox states (unmatched-tag with
   triage actions, plain untagged). Card owns its actions and timestamp —
   no hover-only affordances. Per final assembly.
4. **Shelves directory** replaces the flat list: visible 3-level
   hierarchy, entries show title + colored tag pill + note count, per
   final assembly. Create-page form integrated per design, keeping all
   Phase 2.5 validation/UX behavior (helper text, live pill preview,
   inline errors).
5. **Page colors**: swatch picker (fixed palette, amber preselected) in
   the create-page form; a way to change color on an existing page per
   the design. Tag pills render in page color everywhere pills appear
   (directory, page header, note cards, capture-modal footer). Unmatched/
   dashed pills stay amber always (SPEC v1.6).
6. **Pinned pages**: pin/unpin affordance per design; up to 5 pinned pages
   in the top bar, one-click navigation; 6th pin shows the limit error
   (story 17). Top bar layout per final assembly, still no wrap at 1280px.
7. **Gate fixes if not already merged**: ⌘K capture shortcut (replacing
   browser-reserved ⌘N) and honest disabled search stub.

## Rules carried forward

- All schema changes as new migrations via CLI; never edit old ones.
- All note-routing writes stay on the atomic RPC; actions stay wrapped in
  authenticatedAction; user-input errors return structured results.
- UI verification on a Supabase branch or local stack, never production.
- Reserved browser shortcuts are assumed unusable, not tested.

## Verification

CI green; branch-verified; then Bryan's full manual gate run covering the
Phase 2 script PLUS: create pages in 3+ colors and see distinct pills
everywhere; change a page's color and watch pills update; pin 5 pages,
fail cleanly on the 6th, unpin one; note cards readable in drawer and
Inbox at 1440px and 1280px.
