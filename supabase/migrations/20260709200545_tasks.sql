-- Tasks never parse hashtags and are never auto-routed (SPEC rule) --
-- there is deliberately no body/routing_tag column here, unlike notes.
create table tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  -- A task created inside a task-list block belongs to that block's page.
  -- A task created from the Inbox or global task view is unassigned:
  -- block_id and page_id are both null (Inbox).
  block_id uuid references blocks (id) on delete cascade,
  page_id uuid references pages (id) on delete set null,
  title text not null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_page_matches_block check (
    (block_id is null) = (page_id is null)
  )
);

create index tasks_workspace_id_idx on tasks (workspace_id);
create index tasks_block_id_idx on tasks (block_id);
create index tasks_page_id_idx on tasks (page_id);

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- Keep page_id in lockstep with the owning block's page -- callers only
-- need to set block_id; page_id is derived, matching how `pages.depth` is
-- derived from parent_id rather than trusted from the caller.
create function tasks_sync_page_from_block()
returns trigger as $$
begin
  if new.block_id is null then
    new.page_id := null;
    return new;
  end if;

  select page_id into new.page_id from blocks where id = new.block_id;

  if new.page_id is null then
    raise exception 'block_id does not reference an existing block';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger tasks_before_insert_update
  before insert or update of block_id on tasks
  for each row execute function tasks_sync_page_from_block();
