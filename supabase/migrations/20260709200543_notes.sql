create table notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  page_id uuid references pages (id) on delete set null,
  body text not null default '',
  -- The leftmost tag string parsed from `body` as of the last time routing
  -- was (re-)evaluated. The routing service compares the freshly parsed
  -- leftmost tag against this column and skips re-routing when they match
  -- -- this single rule is what makes rename, delete-during-edit, and
  -- freed-tag reuse all behave correctly without special-casing each one.
  routing_tag page_tag,
  -- true only when routing_tag is set but does not match any page in the
  -- workspace (drives the Inbox "Create #tag" / "Fix tag" prompt). Notes
  -- with no tag at all (routing_tag is null) are plain, prompt-less Inbox
  -- rows.
  routing_unmatched boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_workspace_id_idx on notes (workspace_id);
create index notes_page_id_idx on notes (page_id);

create trigger notes_set_updated_at
  before update on notes
  for each row execute function set_updated_at();

-- All tags found in a note's body, many-to-many, with the leftmost one
-- marked as the routing tag. Kept in sync with `body` on every save,
-- independent of whether the routing decision itself changes -- this is
-- the day-one multi-page-ready data model the SPEC requires even though
-- MVP UI is first-tag-wins.
create table note_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  note_id uuid not null references notes (id) on delete cascade,
  tag page_tag not null,
  is_routing_tag boolean not null default false,
  position smallint not null,
  created_at timestamptz not null default now(),
  unique (note_id, tag)
);

create index note_tags_note_id_idx on note_tags (note_id);
create index note_tags_workspace_tag_idx on note_tags (workspace_id, tag);

-- A note can only have a single routing tag: enforce that at most one row
-- per note has is_routing_tag = true.
create unique index note_tags_one_routing_tag_per_note
  on note_tags (note_id)
  where is_routing_tag;

-- Page delete: notes routed to the deleted page move to the Inbox with
-- their routing tag flagged unmatched; the tag is freed for reuse. This
-- runs before the FK's own ON DELETE SET NULL so routing_unmatched is set
-- atomically with page_id.
create function pages_release_notes_before_delete()
returns trigger as $$
begin
  update notes
  set page_id = null, routing_unmatched = true
  where page_id = old.id;

  return old;
end;
$$ language plpgsql;

create trigger pages_before_delete
  before delete on pages
  for each row execute function pages_release_notes_before_delete();
