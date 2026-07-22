# BACKLOG.md — ThoughtDrop

```
version: 1.1
status: active
source: live production review, 2026-07-22
purpose: a product and engineering backlog for the next planning decision.
```

## Evidence from the live review

- Public sign-in works and is visually coherent at desktop and 375px.
- Authenticated Today, Pages, Page, Inbox, Tasks, navigation, and the open/close
  Capture flow loaded without console errors.
- At a 375px viewport, the authenticated sidebar is 240px wide, the main area
  is only 120px wide, and the document overflows horizontally to 424px. Mobile
  is therefore not currently usable.
- Capture opens with focus in the editor, but Escape closes it and leaves focus
  on the document body.
- The review did not create, edit, pin, or delete test content. Mutation flows
  require a separate, disposable-workspace verification pass.

## Product-owner backlog

### P0 — remove friction and protect user trust

1. **Make the authenticated product usable on a phone.**
   Decide on a mobile navigation model: an overlay drawer is the default
   recommendation because it preserves the existing desktop rail. Below the
   selected breakpoint, start closed, make Capture prominent, and ensure pages
   never horizontally scroll. Treat this as required before claiming mobile
   support.
2. **Make destructive actions recoverable.**
   Replace immediate note and task deletion with an undo toast as the preferred
   experience. Use a short recovery window and clear language about what was
   deleted. A confirmation dialog is an acceptable interim choice if undo
   requires too much schema work.
3. **Make Capture feel reliable.**
   Show a clear saving state, a success outcome, and a helpful failure message
   that keeps the draft intact. On close, return keyboard focus to the Capture
   control that opened the dialog.
4. **Reduce visual duplication in Pages navigation.**
   Pinned pages currently appear both under Pinned and again in the hierarchy.
   Keep Pinned as quick access, then either hide those duplicate tree rows or
   visually de-emphasize them. Validate the choice with a larger page tree.
5. **Make long notes scannable on a page.**
   Preserve full text, but initially clamp unusually long notes and offer an
   explicit Show more / Show less control. A page should still communicate its
   recent ideas at a glance when one note is very long.

### P1 — strengthen daily use

6. **Run a structured daily-driver cycle.**
   Use ThoughtDrop for two weeks and record a tiny daily log: captures made,
   notes later retrieved, Inbox items triaged, task actions, and moments of
   friction. Promote only repeated problems into build work.
7. **Improve Inbox decision-making.**
   Surface why a note is in Inbox, retain the original routing tag, and make
   the two decisions obvious: fix the tag or create its page. Add a useful
   empty-state action that returns the user to Capture.
8. **Clarify the Page surface.**
   Decide the job of a Page before adding blocks: is it primarily a place to
   review routed notes, a working document, or both? Then organize the header,
   recent-note stream, pinned notes, and future blocks around that answer.
9. **Finish the task loop based on actual use.**
   Test creation, status changes, priority, due date, and completion with real
   work. Then improve the list with due-state language, overdue treatment, and
   a focused "what should I do now?" ordering if usage warrants it.
10. **Add recall before adding more creation surfaces.**
    Build basic search across notes, tasks, and pages once there is enough
    content to retrieve. Keep the first version plain, fast, and grouped by
    result type.
11. **Design empty, loading, and error states as first-class product states.**
    Every main screen needs one next action when empty, a calm loading state,
    and a failure state that explains whether work was saved.
12. **Use the real workspace to tune information density.**
    Validate text size, note preview length, sidebar tree expansion, and pin
    limits with 20–50 pages and a few hundred notes before committing to the
    current density as a permanent visual system.

### P2 — deliberate product expansion

13. **Add Page composition only after the Page job is clear.**
    Start with one useful block type and real examples rather than shipping all
    blocks at once. Preserve the capture-and-routing loop as the fastest path
    into a Page.
14. **Add AI tag suggestions only for a demonstrated Inbox problem.**
    Make it on-demand, explain the proposed tag, and make accept/reject
    reversible. Do not make AI a substitute for clearer manual triage.
15. **Plan portability and confidence features.**
    Add export, a basic backup/recovery story, and a privacy explanation before
    ThoughtDrop becomes the sole home for important personal material.
16. **Consider collaboration, integrations, notifications, and native mobile
    only after single-user daily use proves the primary loop.**

## Senior-developer backlog

### P0 — correctness, accessibility, and safe delivery

1. **Implement and test the responsive authenticated shell.**
   Add breakpoint behavior for navigation and verify no horizontal overflow at
   320, 375, 768, 1280, and 1440px. Cover Today, a Page with a long note,
   Inbox, Tasks, and the Capture dialog.
2. **Build an authenticated browser-test suite using a disposable workspace.**
   Cover sign-in, capture and routing, unmatched-tag triage, note edit and
   delete/undo, page creation, pin limit, task lifecycle, sign-out, and
   keyboard shortcuts. Run it against a Supabase branch or local stack, never
   the production project.
3. **Fix Capture dialog semantics and focus management.**
   Use a labelled dialog, give the textarea an accessible name, trap focus while
   open, restore focus to the opener when closed, and announce save errors via
   an ARIA live region.
4. **Handle rejected server actions in every client caller.**
   `CreateNoteModal` and Inbox action handlers handle returned error objects
   but do not consistently catch thrown network or runtime failures. Add a
   shared error boundary/helper so the draft and user-facing error state remain
   reliable under failure.
5. **Introduce a recoverable deletion design.**
   Choose and document either a server-backed soft delete with timed undo or a
   confirmation-only interim design. Add tests for the selected guarantee and
   make concurrent actions idempotent.
6. **Rotate the shared test password and use isolated test credentials.**
   Treat the production test account as sensitive. Keep test credentials out
   of source, logs, screenshots, and CI output, and create an ephemeral test
   user/workspace for automated checks.

### P1 — maintainability and operational confidence

7. **Add end-to-end accessibility checks.**
   Automate keyboard-only navigation, focus order, dialog behavior, label
   coverage, contrast checks, and reduced-motion behavior. Keep manual checks
   for the final visual pass.
8. **Create a standard mutation state pattern.**
   Use consistent pending, success, failure, retry, and rollback/undo behavior
   across notes, pages, pins, and tasks. This avoids every component inventing
   its own action-state logic.
9. **Add validation schemas at every server-action boundary.**
   Validate and normalize all FormData and client arguments server-side, return
   structured field errors, and retain database constraints as the final
   backstop. Test malformed and stale client input.
10. **Add privacy-preserving error monitoring.**
    Capture route, action name, deployment version, and sanitized error class,
    but never note body text, passwords, Supabase tokens, or user content.
11. **Create representative seed data and a reset mechanism.**
    Include nested pages, pins, long notes, unmatched notes, tasks in every
    state, and edge-case tags. Use it for visual QA and browser tests.
12. **Measure and protect performance.**
    Profile the Page tree, Today queries, large note streams, and task lists
    with realistic data. Add indexes, pagination/windowing, and query limits
    only where measured evidence shows they are needed.
13. **Add visual regression coverage.**
    Keep approved screenshots for light and dark desktop views plus the mobile
    shell. Include long-note, populated-Inbox, and error-state fixtures.
14. **Document release and recovery operations.**
    Record migration rollout, rollback, backup/export, Supabase-branch test,
    deployment verification, and incident steps. Keep the document short
    enough to be followed under pressure.
15. **Maintain dependency and security hygiene.**
    Schedule Next.js, React, Supabase, and Node updates; review advisories;
    keep RLS tests and security advisors in the release checklist; and retain
    the existing rule that real functional verification avoids production data.

### P2 — prepare for scale without premature architecture

16. **Extract shared UI primitives only after repetition is clear.**
    Candidates are action feedback, dialogs, note actions, empty states, and
    page-list rows. Do not turn the current product into a generic component
    system prematurely.
17. **Define a search architecture before Phase 5.**
    Decide whether Postgres substring search is sufficient at the expected data
    size, specify authorization boundaries, and test result latency with seeded
    data.
18. **Define AI safety and cost controls before Phase 6.**
    Add an explicit user action, rate limits, budget visibility, logging that
    excludes note content, and deterministic accept/reject tests.

## Suggested next implementation slice

1. Responsive navigation and overflow elimination.
2. Capture accessibility and focus restoration.
3. Recoverable delete and a shared mutation-feedback pattern.
4. Disposable-workspace browser tests for the capture-to-Inbox-to-Page loop.

Do these as one focused hardening slice, then run the daily-driver cycle before
choosing between Page composition, task refinement, or search.

## Claude live-test triage — 2026-07-22

### Fix now

1. **Investigate unexpected logout and intermittent 503 responses.**
   Claude observed a sidebar navigation click redirecting to `/login`, plus a
   `POST /tasks` and a `GET /` returning 503. Reproduce this against the exact
   deployment, preserve deployment/request identifiers, and inspect Vercel and
   Supabase logs. Do not attribute it to cold starts without evidence. This is
   a reliability risk because it combines lost session context and ambiguous
   mutation outcomes.
2. **Make every mutation visibly pending and single-submit safe.**
   Claude observed 1.5–4 second delays with no usable feedback, repeat clicks,
   and a late update that appeared to reverse a task action. Disable or
   serialize each affected control while its request is in flight, show a
   nearby `Working…` state, and use optimistic state only when rollback is
   correct. Test slow and failed requests deliberately.
3. **Ship responsive navigation, then test at 320–870px.**
   This confirms the previously observed mobile defect and adds a moderate
   width overflow case on Today. Check long note previews, Page headers, task
   controls, and horizontal overflow at every breakpoint.
4. **Add page archive/delete.**
   There is no discoverable page removal control, while the product rules
   already define page deletion behavior for routed notes. Prefer Archive as
   the reversible default. If permanent deletion is retained, explain that its
   routed notes move to Inbox and require an explicit confirmation/undo path.
5. **Fix Page creation validation and assistance.**
   The blank routing-tag state is currently a disabled, silent submission path.
   Show a field-level explanation before submit, focus the invalid field when
   the user attempts to continue, change the placeholder to a neutral example,
   and suggest a normalized tag from the title that remains editable.
6. **Make overlays dismiss consistently.**
   Escape must close the page color picker as well as Capture. Add this to the
   overlay/dialog keyboard test suite.

### Fix after measurement

7. **Audit sidebar navigation "double click" reports.**
   This is serious if reproduced, but may be entangled with the logout/503
   incident or the Vercel preview toolbar. Instrument navigation starts and
   completions, reproduce with a clean browser profile, and only then change
   link/event handling.
8. **Audit prefetch rather than disabling it globally.**
   Next.js Link prefetch can explain the observed requests, especially for a
   visible page tree, but it is not by itself a defect. Measure transfer size,
   server load, and navigation latency with a realistic workspace; selectively
   set `prefetch={false}` on large tree sections if it produces measurable harm.
9. **Prioritize tag autocomplete after validation improvements.**
   The existing live route preview is valuable. Suggestions after `#` are a
   good next step once basic tag creation and malformed-tag feedback are clear.
10. **Defer recurrence, reminders, and source links for tasks.**
    They are valid ideas, but task latency, correctness, and the core daily
    task loop are more important first.

### Deployment and test-data follow-up

11. **Confirm the intended production URL.**
    The reviewed `*-git-*-vercel.app` URL is a Vercel preview deployment and
    exposes the preview toolbar. Keep it for QA, but verify the production
    alias separately before judging release readiness.
12. **Clean the two audit pages after archive/delete exists.**
    Claude reported `newtag` and `Test Page Alpha` remain because the current
    UI has no page deletion path. Do not silently remove them from production
    data outside an approved cleanup action.

### Current-worktree caution

The shared local worktree contains uncommitted changes that appear to address
mobile navigation, recoverable note/task deletion, action-error handling,
Capture focus, and browser testing. They are promising implementation work,
not evidence that the deployed preview is fixed. Run the exact live-test cases
above after deployment before marking any related backlog item complete.

## Hardening slice progress — 2026-07-22

- Responsive shell implemented: below 768px the desktop rail becomes a closed
  overlay drawer, Capture remains in the mobile header, the drawer locks body
  scroll and restores focus, and the app shell prevents horizontal overflow.
- Capture accessibility implemented: labelled modal, labelled editor, focus
  trap, Escape close, opener-focus restoration, explicit saving state, success
  feedback, and draft-preserving network/runtime failure handling.
- Recoverable deletion shipped to the database and implemented in code: notes and tasks use `deleted_at`,
  active queries exclude soft-deleted rows, and a shared eight-second Undo toast
  restores the row server-side. Migration `20260722132834` was verified on an
  isolated branch, applied to production, and passed the Supabase security advisor.
- Authenticated Playwright coverage added for the capture-to-Inbox-to-Page loop,
  deletion/undo, Capture focus behavior, and shell overflow at 320, 375, 768,
  1280, and 1440px. Mutation tests hard-refuse to run unless the environment is
  explicitly marked disposable.
- Browser verification passed on the data-free `codex-hardening-e2e` Supabase
  branch. The temporary branch and credentials were deleted after the run, so
  no ongoing branch cost remains and production data stayed out of scope.
