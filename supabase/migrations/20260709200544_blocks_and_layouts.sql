create table blocks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  page_id uuid not null references pages (id) on delete cascade,
  type text not null check (type in ('rich_text', 'task_list', 'table')),
  column_index smallint not null check (column_index >= 0),
  position smallint not null default 0,
  -- rich_text: formatted content; table: rows/columns of plain text cells.
  -- task_list blocks hold no content here -- their tasks are first-class
  -- rows in the `tasks` table referencing this block.
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blocks_page_id_idx on blocks (page_id);
create index blocks_workspace_id_idx on blocks (workspace_id);

create trigger blocks_set_updated_at
  before update on blocks
  for each row execute function set_updated_at();

create table page_layouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  page_id uuid not null unique references pages (id) on delete cascade,
  column_count smallint not null default 2 check (column_count between 2 and 4),
  -- Ratios, not pixels, so the fluid-shrink canvas (DESIGN D3) can scale
  -- columns proportionally. Array length must equal column_count; summing
  -- to 1 is an application-layer invariant, not enforced here.
  column_widths jsonb not null default '[0.5, 0.5]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint page_layouts_widths_length check (
    jsonb_array_length(column_widths) = column_count
  )
);

create index page_layouts_workspace_id_idx on page_layouts (workspace_id);

create trigger page_layouts_set_updated_at
  before update on page_layouts
  for each row execute function set_updated_at();
