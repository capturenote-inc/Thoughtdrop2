set lock_timeout = '5s';

alter table pages
  add column archived_at timestamptz;

-- Active pages drive navigation, routing, and page lookup. Keep archived rows
-- out of that hot path while retaining their notes and hierarchy for restore.
create index pages_active_workspace_title_idx
  on pages (workspace_id, title)
  where archived_at is null;

create index pages_archived_workspace_archived_at_idx
  on pages (workspace_id, archived_at desc)
  where archived_at is not null;
