-- Tags are stored lowercase without the leading '#', matching
-- lib/routing's parser output: #[a-zA-Z][a-zA-Z0-9_-]{0,63} case-folded.
create domain page_tag as text
  check (value ~ '^[a-z][a-z0-9_-]{0,63}$');

create table pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  parent_id uuid references pages (id) on delete restrict,
  tag page_tag not null,
  title text not null,
  depth smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, tag)
);

create index pages_workspace_id_idx on pages (workspace_id);
create index pages_parent_id_idx on pages (parent_id);

-- Nesting is capped at 3 levels (depth 0, 1, 2) and a page's parent must
-- live in the same workspace. depth is derived, never set directly by
-- callers.
create function pages_set_depth_and_validate()
returns trigger as $$
declare
  parent_depth smallint;
  parent_workspace_id uuid;
begin
  if new.parent_id is null then
    new.depth := 0;
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'a page cannot be its own parent';
  end if;

  select depth, workspace_id into parent_depth, parent_workspace_id
  from pages where id = new.parent_id;

  if parent_workspace_id is null then
    raise exception 'parent_id does not reference an existing page';
  end if;

  if parent_workspace_id != new.workspace_id then
    raise exception 'a page''s parent must belong to the same workspace';
  end if;

  if parent_depth >= 2 then
    raise exception 'pages may not be nested deeper than 3 levels';
  end if;

  new.depth := parent_depth + 1;
  return new;
end;
$$ language plpgsql;

create trigger pages_before_insert_update
  before insert or update of parent_id, workspace_id on pages
  for each row execute function pages_set_depth_and_validate();

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger pages_set_updated_at
  before update on pages
  for each row execute function set_updated_at();
