# Handoff: ThoughtDrop MVP — Four Core Surfaces

## Overview
Visual design for ThoughtDrop, a single-user desktop web app for capturing notes that self-file via hashtags. Four surfaces: **Page view** (drawer + column canvas), **Top bar**, **Inbox** (triage), and **Capture modal**. Interaction decisions are locked in SPEC.md / DESIGN.md (included in this bundle): notes drawer, inline Inbox triage, fluid-shrink canvas, first-tag-wins routing. This handoff covers visual design only.

Approved direction: **"Paper Quiet"** — warm paper neutrals, hairline borders, no shadows, flat, compact density, sans UI + monospace accents, a single amber accent reserved for tags, counts, and the Create Note button.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and feel, not production code. Recreate these designs in the target codebase's existing environment (React, Vue, etc.) using its established patterns; if no environment exists yet, choose the most appropriate framework and implement there.

`ThoughtDrop Explorations.dc.html` renders as a design canvas. **Turn 2 (top section, ids 2a–2d) is the approved final design.** Turn 1 (1a–1c) is earlier exploration — ignore except as history (1a was the chosen direction).

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final. Recreate pixel-perfectly at 1440px; layout is fluid-percentage and must hold at 1280px with no horizontal scroll.

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| bg | #FBFAF7 | App background |
| bg-modal | #FFFEFB | Modal surface |
| bg-suggestion | #FDFBF5 | Inbox row w/ active suggestion |
| ink | #21201C | Primary text, headings |
| ink-body | #3B3830 | Long-form body text |
| ink-secondary | #6E6A61 | Nav (inactive), row actions, meta |
| ink-faint | #A6A198 | Timestamps, placeholders-adjacent, column headers, hints |
| ink-ghost | #C4BFB4 | Placeholder text, kbd hints, empty checkbox border |
| border | #E9E5DC | Primary hairlines (top bar, drawer, column dividers, table header rule) |
| border-soft | #F1EEE6 | Row separators (drawer, tasks, table, inbox) |
| border-modal | #E0DCD2 | Modal border |
| amber | #C2701A | Create Note fill, checked checkbox, caret, primary action fill |
| amber-ink | #96590F | Tag pill text, badge text, P1 priority, tag-related actions |
| amber-tint | #F8ECDA | Tag pill bg, badge bg, checked-pending checkbox bg |
| amber-dashed | #E0B072 | Dashed border on unmatched-tag pill |
| on-amber | #FFFDF9 | Text on amber fills |
| scrim | rgba(33,32,28,.18) | Modal overlay |

No shadows anywhere. No dark mode for MVP.

### Typography
- **UI sans**: Helvetica Neue / Helvetica / Arial stack (system-safe; no webfont needed for sans).
- **Mono accents**: JetBrains Mono (Google Fonts, weights 400/500) — used for ALL tags, counts, timestamps, priorities, table numerals, and keyboard hints.

| Style | Spec |
|---|---|
| Page title (h1) | 26px / 600 / letter-spacing -0.02em / ink |
| Wordmark | 13.5px / 600 / -0.01em |
| Nav items | 13px / 400 (active: 500 + ink) |
| Body text (blocks) | 13.5px / 1.6 line-height / ink-body |
| Row text (drawer, inbox, tasks) | 13–13.5px / 1.45–1.5 |
| Column header | 11px / 500 / UPPERCASE / letter-spacing .08em / ink-faint |
| Tag pill | mono 11px (12px next to h1, 12.5px in modal) |
| Timestamp | mono 10.5px / ink-faint |
| Count badge | mono 10.5px |
| kbd hints (⌘N, ⌘↵, esc, /) | mono 10px |
| Buttons | 12–13px / 500–600 |
| Helper/hint text | 11.5px / ink-faint |

### Spacing & shape
- Page gutter: 40px (top bar gutter: 24px)
- Top bar height: 48px; drawer bar height: 36px
- Row padding: 8px vertical (drawer), 11px (inbox), 7px (tasks), 6px (table)
- Radii: buttons/inputs 6px, tag pills fully rounded (9–11px on ~18px height), checkboxes 4px, modal 10px, logo mark 3px
- Border width: 1px everywhere (1.5px checkbox strokes)

### Components (shared)
- **Tag pill**: mono text, amber-tint bg, amber-ink text, padding 1px 7px, full-round. Unmatched variant adds `1px dashed #E0B072`. Secondary (non-routing) tags in note text render as plain mono ink-faint text, no pill.
- **Primary button** (Create Note, Save): amber fill, on-amber text, 600 weight, h 28–30px, radius 6px, optional mono kbd hint at 75% opacity.
- **Secondary/inline button** (Edit, Fix tag, Suggest tag): 1px border-color border, ink-secondary text, h 26px, radius 6px. Amber-outline variant (Create #tag): border amber, text amber-ink.
- **Checkbox**: 14px, radius 4px. Empty: 1.5px ink-ghost border. In-progress: 1.5px amber border + amber-tint fill. Done: amber fill, white ✓, row text struck + ink-faint.
- **Count badge**: amber-tint bg, amber-ink mono text, full-round, only rendered when count > 0.

## Screens / Views

### 1. Top bar (2b) — persistent on every screen
48px tall, bg, 1px border-b (border). Left→right, 24px side padding:
1. **Logo/home**: 16px amber square (radius 3) + "ThoughtDrop" wordmark. Clicking = home.
2. **Nav** (20px gaps): Pages · Tasks · Inbox. Inactive ink-secondary; active ink + 500 weight. No underlines, no icons.
3. **Inbox badge**: count badge, 6px after "Inbox". Hidden at 0.
4. Flexible spacer.
5. **Search**: 260×28px, 1px border, radius 6, placeholder "Search" in ink-faint, right-aligned mono "/" hint. Shrink to ~200px at 1280 if needed.
6. **Create Note**: primary button, far right, always visible, label "Create Note" + mono "⌘N". The single filled element in the bar — the most important element in the app.

### 2. Page view (2a)
Full-width canvas (100vw minus 40px gutters), no sidebar, no max-width column.

- **Page header** (36px top padding): breadcrumb prefix "Growth /" (12px ink-faint) · h1 title · routing tag pill, baseline-aligned, 14px gaps.
- **Notes drawer** (20px below header): full-width bar bounded by 1px top+bottom hairlines (border).
  - **Collapsed (default)**: single 36px row — "▶" (9px, ink-faint) · "Notes" (12.5px, 500, ink) · "(7)" mono count (ink-faint). Costs one bar; canvas begins directly below.
  - **Expanded**: caret rotates to ▼; newest-first note rows appear below the bar, each separated by border-soft hairline, indented 19px to align with the label. Row = note text (13px, inline tag pills; routing tag as pill, other tags plain mono faint) · mono timestamp · "Edit" · "Delete" (12px, ink-secondary, text-only actions; show on hover in implementation).
- **Column canvas** (28px below drawer): 2–4 columns, percentage widths (demo: 38 / 34 / 28). Between columns: a 9px-wide `col-resize` hit area with a 1px border-color line centered in it (32px content padding each side of the divider). Columns shrink proportionally on resize/viewport change; **no horizontal scroll ever**.
  - Every column starts with an uppercase column header (block title).
  - **Rich text block**: 13.5px/1.6 ink-body paragraphs, 10px paragraph gaps, strong = 600.
  - **Task list block**: rows 7px v-padding, border-soft separators, checkbox (states above) · task text 13.5px · mono priority (P1 in amber-ink, others ink-faint) · mono date. Ghost "+ Add task" row (12.5px ink-faint).
  - **Simple table block**: header row 11px/500 ink-faint with border (not border-soft) bottom rule; data rows 12.5px, numerals in mono 11.5px right-aligned, border-soft separators, no vertical rules, no cell backgrounds.

### 3. Inbox (2c)
Same top bar (Inbox active + badge). Header: h1 "Inbox" + mono "4 untriaged" (12px ink-faint). List starts under a 1px border hairline; rows 11px v-padding, border-soft separators, 13.5px text, 14px gaps. Three row states:

1. **Unmatched routing tag**: text with dashed amber tag pill inline + "— no page owns this tag" (11.5px ink-faint) · timestamp · **[Create #onboarding]** amber-outline button · **[Fix tag]** secondary button.
2. **Untagged, idle**: plain text · timestamp · **[Suggest tag]** secondary button (on-demand — never auto-suggest).
3. **Suggestion returned**: row bg becomes bg-suggestion; right side shows "Suggested" (11.5px ink-faint) · suggested tag pill · **✓** 26×26 amber-filled accept · **✕** 26×26 bordered ink-faint reject. Accept applies the tag and files the note; reject returns the row to state 2.

Triage is fully inline — no detail view, no drag targets.

### 4. Capture modal (2d)
Opens over any screen from Create Note / ⌘N. Underlying page stays visible under `scrim` overlay.

- **Modal**: 520px wide, top-anchored at 72px, centered horizontally. bg-modal, 1px border-modal, radius 10. No title, no toolbar, no fields other than the textarea.
- **Textarea**: padding 18px 20px, min-height 150px, 14.5px/1.6. Placeholder (ink-ghost): "Type a thought… a #tag files it for you". Caret rendered amber.
- **Live tag highlight**: as the user types, any `#tag` token restyles inline into a tag pill (mono 12.5px, amber-tint/amber-ink) inside the text.
- **Footer** (padding 10px 20px 14px): left hint — empty state: "No tag? It lands in your Inbox." (11.5px ink-faint); filled state: "Files to `#marketing` → Marketing" (ink-secondary, tag as small pill) reflecting the FIRST tag typed (first-tag-wins). Right: mono "esc" hint · **Save** primary button with mono "⌘↵".

## Interactions & Behavior (visual notes only — logic per SPEC/DESIGN)
- Drawer expand/collapse: caret rotate + rows reveal; suggest 120–160ms ease-out height transition.
- Column resize: cursor `col-resize` on the 9px divider hit area; divider line may darken to ink-faint on hover/drag.
- Hover states: text action links (Edit/Delete) darken to ink; bordered buttons darken border to ink-ghost and text to ink; primary button darkens ~6% (e.g. #B0650F).
- Row hover: bg-suggestion-level tint (#FDFBF5) acceptable on interactive lists.
- Modal: appears instantly or ≤120ms fade; focus lands in textarea immediately; esc closes; ⌘↵ saves.
- Search focus via "/", capture via ⌘N — global.
- Responsive: fluid percentages; verify at 1280px (search input may shrink; nothing wraps in the top bar; columns compress proportionally).

## State Management (per screen, minimum)
- Top bar: untriaged count (badge), active nav route.
- Page view: drawer open/closed (persist per page), notes list (newest first), column widths (persist), block content.
- Inbox: per-row triage state (unmatched-tag / untagged / suggestion-pending / suggestion-returned), suggestion result.
- Capture modal: open/closed, draft text, parsed first-tag → resolved destination page (live).

## Assets
No image assets. Logo is a pure-CSS 16px amber rounded square. One webfont: JetBrains Mono (400, 500) from Google Fonts. Sans is a system stack.

## Files
- `ThoughtDrop Explorations.dc.html` — design canvas; **section id `t2` (2a–2d) is the approved design**; `t1` is exploration history.
- `SPEC.md`, `DESIGN.md` — locked product/interaction spec. Implement behavior from these; this README covers visuals.
