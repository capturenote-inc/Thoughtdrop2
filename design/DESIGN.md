# DESIGN.md — ThoughtDrop MVP

```
version: 1.0
status: approved
scope: closes SPEC.md open questions 1-3; adds interaction detail for the
  notes drawer, Inbox triage actions, and canvas width behavior
```

## D1. Routed note rendering: collapsed notes drawer

Each page has a **notes drawer**: a full-width collapsible section directly below the page header, above the column canvas.

- Collapsed by default: a single bar showing "Notes (N)" where N is the count of notes routed to this page.
- Expanded: notes listed newest-first, each as a discrete row with edit and delete actions (per stories 13-15, notes remain discrete objects; they are never merged into blocks).
- The column canvas is never disturbed by incoming routed notes.
- Drawer open/closed state is per-session, not persisted.

Known tension, accepted: the problem statement promises "topic at a glance" and the drawer hides captured notes by default. If this hurts during the 14-day test, the candidate fix is a persisted per-page "pinned open" state. **Post-MVP, logged.**

## D2. Unmatched-tag prompt: inline in Inbox

No interruption at capture time. The Inbox row for a note whose routing tag is unmatched shows the tag with two actions:

- **[Create #tag]**: creates the page owning that tag and routes the note to it immediately. (Manual triage action; does not conflict with the no-auto-re-route rule for freed tags, which applies only to passive matching.)
- **[Fix tag]**: opens the note editor with the tag focused. Saving re-runs routing per the SPEC re-route trigger rule (the tag string changed).

Notes with no tag at all show no prompt; they are plain triage items (and eligible for AI tag suggestion, story 12).

## D3. Canvas width: fluid shrink

The page canvas is 100% of viewport width. Columns keep their proportional (persisted) widths and shrink together. No horizontal scrolling, no breakpoint reflow, no layout jumps. Persisted column widths are stored as ratios, not pixels.

## Pipeline note

Approved. Consumable by the Architect and by PHASES.md. Column resize
interaction (drag-handle behavior, min widths) remains open for the
implementation phase where story 6 lands.
