-- SECURITY DEFINER + stable search_path so this runs as the table owner
-- and bypasses RLS internally -- referencing workspace_members from a
-- policy defined ON workspace_members would otherwise recurse.
create function is_workspace_member(check_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = check_workspace_id and user_id = auth.uid()
  );
$$;

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table pages enable row level security;
alter table notes enable row level security;
alter table note_tags enable row level security;
alter table tasks enable row level security;
alter table blocks enable row level security;
alter table page_layouts enable row level security;

create policy "workspaces_member_access" on workspaces
  for all
  using (is_workspace_member(id))
  with check (is_workspace_member(id));

create policy "workspace_members_member_access" on workspace_members
  for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "pages_member_access" on pages
  for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "notes_member_access" on notes
  for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "note_tags_member_access" on note_tags
  for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "tasks_member_access" on tasks
  for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "blocks_member_access" on blocks
  for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "page_layouts_member_access" on page_layouts
  for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
