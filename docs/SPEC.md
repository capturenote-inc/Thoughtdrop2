# SPEC.md — ThoughtDrop

```
version: 1.10
status: exploratory
changed: v1.5 added page colors (fixed palette, user-picked, default amber;
  schema adds pages.color). v1.6 accepts pinned pages into MVP from the
  design iteration: up to 5 pages pinnable to the top bar (schema adds
  pages.pinned_at). Home screen design ("Dashboard") produced early by the
  design iteration; build remains Phase 4. v1.7 removes MVP compliance as a
  planning constraint: this is a fun, exploratory project and ideas outside
  the original MVP are build candidates rather than automatic deferrals. v1.8
  selects Focused Ledger as the visual direction: operational views are calm,
  structured lists; Pages are writing contexts; notes render as contextual
  objects; light and dark appearance are first-class. v1.9 refines that
  direction: capture is a compact writing surface, notes use a low-chrome
  paper treatment, and the sidebar presents the actual collapsible page tree.
  v1.10 makes page pins visible as sidebar quick access and adds persistent
  note pins that sort important notes first in their Page or Inbox.
```

## Problem statement

Existing note tools (Notion et al.) force manual filing and waste screen real estate on a narrow, paper-width canvas. Thoughts captured in the moment either get lost or require organizational overhead at capture time. ThoughtDrop removes the filing step: hashtags in the text itself route notes to the right topic page automatically, and pages use the full width of the screen so a topic can be seen at a glance instead of scrolled through.

## Target user

Bryan, building a personal thinking workspace that can become whatever proves
useful in practice. The current account is single-user; the existing
workspace-aware data model remains a useful foundation, not a restriction on
future collaboration or personal workflows.

## Product shape

Web application. A collapsible left rail orders Today, Inbox, Tasks, and
Pages; the Pages collection expands in place and Capture is always visible.
The Focused Ledger visual language favors restrained borders, dense task rows,
and a neutral theme with a deliberate accent, in both light and dark modes.
The Pages rail exposes the real parent/child hierarchy and provides distinct
navigation to Pages and to create a new page. Pinned pages appear in a
dedicated quick-access section above the tree.
Pages are wide-canvas (roughly 2–3x Notion width), infinite vertical length.

## Core concepts

- **Page**: a topic container identified by a globally unique hashtag (e.g. `#marketing`). Pages nest up to **three levels deep**. Nesting is represented by a `parent_id` reference on the page; tag uniqueness is enforced by a database unique constraint. Because tags are globally unique, nesting is organizational only and never affects routing. Each page has a **color** chosen from a fixed palette (user-picked at create/edit, default amber); the page's tag pill renders in that color wherever it appears. Unmatched tags (no owning page) always render in the default amber treatment.
- **Note**: a captured thought containing zero or more hashtags. The UI keeps
  its routing context, capture time, and available actions with its body so it
  reads as a meaningful object rather than an anonymous text row. Capture and
  note presentation should feel like writing surfaces, not oversized terminal
  dialogs or generic dashboard cards. A user may pin a note; pinned notes
  persist and sort above unpinned notes within the current Page or Inbox.
- **Task**: a first-class object with due date, priority, and status (todo / doing / done). **Tasks do not parse hashtags and are never auto-routed.** A task created inside a task-list block belongs to that page; a task created from the Inbox or global task view is unassigned (Inbox). Routing applies to notes only.
- **Inbox**: the destination for every note without a tag or whose routing tag matches no existing page, and for unassigned tasks.
- **Routing**: any note containing `#tag` is automatically placed on the page owning that tag, per the rules below.

## Decision: routing rules

**Tag syntax**: a hashtag is `#` followed by a letter, then up to 63 letters, digits, underscores, or hyphens (`#[a-zA-Z][a-zA-Z0-9_-]{0,63}`), and must be preceded by start-of-text or whitespace. Mid-word and URL-fragment occurrences (`foo#bar`, `https://ex.com#tag`) are not tags. Matching is case-insensitive; tags are stored lowercase.

A note may contain multiple hashtags. The **routing tag is the leftmost hashtag in the note body**. For MVP, UI behavior is first-tag-wins: the note appears on exactly one page, the page owning its routing tag. The **data model is many-to-many from day one**: all tags on a note are stored as relations, with the routing tag marked, so multi-page appearance can ship post-MVP without schema rework. This is a binding constraint on the Architect, consistent with the team-readiness constraint.

**Re-route trigger**: on save (create or edit), the leftmost tag is parsed and compared to the note's stored routing tag string. **Routing is re-evaluated only if they differ.** If unchanged, the note keeps its current assignment, whatever that is. This single rule covers rename (body still contains the old tag string, so the note stays on its page) and page-delete-during-edit (the delete already moved the note to the Inbox; the save's unchanged tag string leaves that assignment intact).

If re-evaluation runs and the new routing tag matches no page, or no tag remains, the note lands in the Inbox (story 4). Non-routing tags that match no page are ignored in MVP.

## Decision: tag rename and page delete

- **Page delete**: notes routed to the deleted page move to the Inbox with their routing tag flagged unmatched. The tag is freed for reuse. Re-creating a freed tag does **not** auto-re-route previously flagged notes; they stay in the Inbox until the user triages or edits their tag.
- **Tag rename**: the page keeps its already-routed notes (per the re-route trigger rule: their leftmost tag string is unchanged, so no re-evaluation occurs; note bodies are not rewritten). Future notes using the old tag land in the Inbox as unmatched.

## Core user stories

1. As a user, I click the always-visible Create Note button from any screen, type a thought, and it is saved without me choosing a location. Create Note always produces a Note; tasks are created only inside task-list blocks or from the global task view / Inbox.
2. As a user, when my note contains a hashtag matching an existing page, the note appears on that page automatically.
3. As a user, when my note has no hashtag, it lands in the Inbox for later triage.
4. As a user, when my note's routing tag matches no existing page, it lands in the Inbox and I am prompted to either create the page or fix the tag. The prompt applies to the routing tag only; other unmatched tags are ignored in MVP. (Prompt surface — modal vs inline — is a Designer decision.)
5. As a user, I can create pages and nest them up to three levels deep, each with a globally unique hashtag and a color picked from a fixed palette (changeable later by editing the page).
6. As a user, I can compose a page from blocks arranged in 2–4 drag-resizable columns (no free-form placement). Column count and widths persist per page, server-side. (Resize interaction details are a Designer decision.)
7. As a user, I can use three block types: rich text, task list, and simple table.
8. As a user, I can create tasks with a due date, priority, and status (todo / doing / done), and update them in place.
9. As a user, I can open a global task view from the sidebar showing all tasks across all pages, and act on them there.
10. As a user, my Home screen shows my upcoming tasks, my untriaged Inbox count, and my recently visited pages.
11. As a user, I can run a basic search across notes, tasks, and page titles: substring match only, no filters, no ranking.
12. As a user, for any untagged note in my Inbox, I can request/receive an AI-suggested tag and accept or reject it in one action. (In scope; scheduled as the final phase in PHASES.md so it can slip without blocking the core loop.)
13. As a user, I can edit the content of any note or task after capture. Editing a note re-runs routing per the routing rules.
14. As a user, I can delete any note or task, from its page, the Inbox, or the global task view.
15. As a user, when editing changes a note's routing tag, the note re-routes to the page owning the new routing tag (or to the Inbox if no tag remains or it is unmatched).
16. As a user, I can open the Pages collection from the sidebar, see all my pages and their nesting, and navigate to any page from it.
17. As a user, I can pin up to 5 pages to the expanded Pages collection for one-click access, and unpin them. Attempting a 6th pin explains the limit.

## Idea backlog, not exclusions

The original non-goals below are useful for sequencing and design discussion,
but none is a standing prohibition. Bryan may pull any item into active work
when it is interesting or useful. New ideas receive a concrete brief and
implementation plan rather than an automatic "out of scope" label.

- Team features: multi-user access, invites, sharing, permissions, shared pages. (Data model must anticipate them; UI must not.)
- Free-form grid layout (drag blocks anywhere). MVP is columns only.
- Block types beyond the core three: image, calendar, kanban board, mind map, embeds.
- Nesting deeper than three levels.
- Multi-page note appearance (data model supports it; UI is first-tag-wins).
- Hashtag routing for tasks.
- AI beyond Inbox tag suggestion: MCP server/client, external connectors (Granola, Notion, etc.), behavioral nudges, page-content AI.
- Search beyond substring match: filters (tag, type, date, status), ranking, full-text indexing.
- Mobile app or mobile-optimized layout. MVP targets desktop browsers.
- Offline mode, import/export, notifications, reminders.

## Current working objectives

1. All core flows function without blocking bugs: capture, tag routing, Inbox triage (create page / fix tag), page composition with the three block types, task lifecycle (create → status changes → done), global task view, search, AI tag suggestion. **Blocking** means: data loss, a mis-route that cannot be corrected by editing the note, auth failure, or the capture flow being unavailable. Cosmetic or workaround-able issues are non-blocking.
2. Bryan uses ThoughtDrop often enough to expose what deserves to be built
next. A 14-day daily-driver run remains valuable evidence, but it is not a
binary release gate.
3. New work improves either capture, recall, organization, expression, or
the pleasure of using the product without compromising data integrity.

## Open questions (for downstream roles, not blockers)

1. Which AI provider/model backs the tag suggestion, and does it run on-demand or automatically? (Architect; on-demand is the cheaper default.)

Former questions 1-3 (routed-note rendering, unmatched-tag prompt surface, canvas width) are closed in DESIGN.md v1.0: collapsed per-page notes drawer, inline Inbox triage actions, fluid-shrink canvas.

## Pipeline note

Approved at v1.3 after two adversarial review rounds (full + delta). Consumable by the Designer.
