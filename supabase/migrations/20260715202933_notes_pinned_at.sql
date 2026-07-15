-- A pinned note is a deliberate piece of context the user wants to keep at
-- the top of its current Page or Inbox. There is no cap: note importance is
-- personal, and the partial index keeps the pinned-first view queries cheap.
alter table notes
  add column pinned_at timestamptz;

create index notes_pinned_at_idx
  on notes (workspace_id, page_id, pinned_at desc)
  where pinned_at is not null;
