# Phase 2.9 brief — Product shell and visual reset

```
status: proposed direction, not yet implemented
date: 2026-07-15
inputs: SPEC.md v1.6, DESIGN.md v1.0, Phase 2.75 implementation
scope guard: visual hierarchy and interaction design only. Do not add new
  storage, AI, collaboration, search, task, or block capabilities here.
```

## The decision

ThoughtDrop should not imitate a generic document database. Its distinctive
promise is **capture now, arrive in the right place without filing**. The app
should feel like a calm, personal thinking desk whose contents organize
themselves, not like a paper-coloured administration tool.

The selected direction is **Studio Desk**:

- An inky, compact navigation rail anchors the workspace without narrowing
  the working canvas. Its order is **Today, Inbox, Tasks, Pages**. Pages is
  an expandable collection in the rail, so the actual spaces remain one
  click away. It replaces the crowded top bar.
- The main canvas is warm and bright, with strong editorial hierarchy:
  large page titles, deliberate whitespace, and an obvious primary action.
  The page colour is an identity accent, not a card background pasted onto
  every surface.
- Capture is a prominent composer surface. It immediately makes the routing
  destination legible, then disappears from the way. It must remain faster
  than deciding where a thought belongs.
- A future Home screen is named **Today**. It is the personal front door:
  capture, what needs attention, recent activity, and pinned/recent pages.
  Do not turn it into a dashboard full of charts.

This replaces the previous "Paper Quiet" visual direction for every shell
surface touched by Phase 2.9. Existing routing, page nesting, page colours,
and pin behaviour remain unchanged.

## Why this is the right move

Current leaders have converged on a clear pattern. Tana makes a daily
workspace and immediate capture the front door; Capacities uses daily notes
as a time anchor for connected information; Craft treats note-taking as a
high-craft writing environment; Reflect wins on fast capture and recall.
ThoughtDrop should borrow their *clarity and momentum*, not their feature
sets. Its differentiated loop is automatic hashtag routing, and the UI must
make that feel dependable and satisfying.

Do **not** add a graph, object schemas, calendar integration, backlinks,
voice capture, or an AI chat to compensate for weak visual design. Those are
separate product bets and would blur the MVP.

Research sources:

- Tana daily notes and capture: <https://outliner.tana.inc/daily-notes>
- Capacities product and daily notes: <https://capacities.io/product>
- Craft daily notes: <https://support.craft.do/en/plan-and-do/daily-notes>
- Reflect product: <https://reflect.app/>

## Design diagnosis

1. The product is visually polite but has no centre of gravity. The current
   top bar gives Pages, Tasks, Inbox, disabled Search, pins, Create Note,
   and Sign out nearly equal visual weight. A first-time user cannot tell
   what to do first.
2. Almost every element is 11–13px, lightly bordered, warm grey, and rounded.
   That makes the UI read as a dense utility from an older SaaS generation,
   rather than a contemporary workspace with confident hierarchy.
3. The page directory's repeated shelf cards and the note cards make the
   product feel assembled from components. They do not create a sense of a
   coherent place to think.
4. A page currently opens into a compact heading, a collapsed notes drawer,
   and a "Phase 3" placeholder. That hides the only real content and makes
   the page feel empty before block composition exists.
5. Disabled Search is honest, but it should not occupy premium navigation
   space before search exists. An absent feature is less distracting than a
   permanent unavailable control.

## Non-negotiable visual rules

- Use one meaningful primary action per view. On app surfaces it is Capture.
- Use content density intentionally: short notes can be dense; navigation,
  headings, empty states, and composer need air.
- Do not use a border and rounded rectangle by default. Cards are reserved
  for distinct objects that need separation; lists, streams, and nav remain
  flatter.
- Replace text-only secondary actions such as Pin and Color with an icon plus
  a visible label or tooltip. Never rely on hover alone for destructive or
  stateful actions.
- Retain page colours as compact semantic accents. They should not compete
  with note text or convert the directory into a rainbow of containers.
- Use a local system sans stack for the product UI. Do not introduce a new
  remote font dependency simply to change the visual feel.
- Desktop is the target, but every visual gate is reviewed at 1440×900 and
  1280×800 before release.

## Screen direction

### App shell

- Fixed left rail: 72px icon-first at rest; expands to 224px on explicit
  toggle. The expanded state contains labelled navigation and an expandable
  Pages collection, ordered with pinned pages first. It is the only dark
  surface: `#191916` with quiet warm-white text.
- Main workspace: `#F7F5F1` base with `#FFFDFC` elevated composer and modal
  surfaces. Ink is near-black (`#161512`); dividers are restrained
  (`#E5E2DC`). The capture signal is warm vermilion (`#D95D21`), not beige
  amber. Exact hue values may tune during implementation.
- Remove the disabled Search control from the shell until Phase 5. The
  search destination and shortcut ship together in Phase 5.
- Keep one visible capture button in the rail. On wide screens, pair it with
  a keyboard shortcut hint; it remains permanently reachable.

### Today (Phase 2.9 foundation)

- Open with an inviting inline composer: "Capture a thought… #tag routes it."
- Below it, two columns: **Now** (Inbox triage and existing open tasks) and
  **Momentum** (recent routed notes and pinned pages). Sections collapse to
  a purposeful empty state when data does not exist; no invented metrics.
- Today is a work surface, not an analytics dashboard. No charts, streaks,
  or ornamental widgets in MVP.

### Topic page

- Use a 36–44px title, a small coloured `#tag`, and one muted breadcrumb.
  Pin and colour controls live in a compact page-actions menu.
- Notes are a visible **recent stream** by default, at least while the block
  canvas is not implemented. The stream can collapse after it has content;
  the default must never make a newly opened page look blank.
- When Phase 3 arrives, the notes stream remains a distinct capture layer
  above the composition canvas. It is not merged into blocks.

### Pages directory

- Replace shelves with a simple spatial index: a strong "Your spaces" title,
  flat grouped rows for page hierarchies, and only top-level pages as visual
  anchors. Sub-pages indent quietly underneath.
- Create-page controls belong in a focused sheet or inline composer, not a
  full form permanently competing with the directory.

### Inbox and capture

- Inbox is a triage stream, not a two-column card grid. Use date groupings
  and subtle page/tag accents so scanning remains quick.
- The capture composer is the brand moment. It should have generous type,
  immediate routing feedback, and a clear Save action. No decorative chrome
  that slows the thought down.

## Implementation order

1. Establish the new tokens, system font stack, interaction states, and app
   shell. Build the rail with the existing routes and pinned-page data only.
2. Rebuild the capture composer, Inbox stream, page header, and page notes
   stream with the new hierarchy. Preserve all existing server actions and
   tests.
3. Rebuild the directory as the spatial index and remove the unavailable
   Search control.
4. Implement the Today foundation from real existing data: Inbox count, open
   tasks, recent notes, and pinned pages. Phase 4 extends it with the full
   task lifecycle and recently visited pages; do not create fake data.
5. Run visual QA at 1440×900 and 1280×800 using realistic seeded data:
   8+ pages, nested pages, 15+ notes, 3 unmatched notes, and 5 pins.

## Acceptance criteria for this phase

- The first obvious action from every app surface is capture.
- No page with existing notes appears empty on first open.
- Navigation has one clear hierarchy and does not wrap or clip at 1280px.
- Pinned pages, Inbox count, and all current routing feedback remain visible
  and correct in the new shell.
- There are no styled but inert controls, per the Phase 2 gate rule.
- Existing Phase 2 and 2.75 functional gates still pass, followed by the
  visual gate above.

## Explicitly deferred

- Mobile layout, themes/dark mode, animations beyond useful feedback,
  rebranding/marketing site, icon illustration system, graphs, backlinks,
  calendar, voice capture, full search, AI chat, and new task features.
