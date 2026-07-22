set lock_timeout = '5s';

alter table notes
  add column deleted_at timestamptz;

alter table tasks
  add column deleted_at timestamptz;

-- Active rows are the hot path. Keep soft-deleted history out of the indexes
-- used by Page, Inbox, Today, and Tasks queries.
create index notes_active_workspace_page_created_idx
  on notes (workspace_id, page_id, created_at desc)
  where deleted_at is null;

create index tasks_active_workspace_status_created_idx
  on tasks (workspace_id, status, created_at desc)
  where deleted_at is null;
