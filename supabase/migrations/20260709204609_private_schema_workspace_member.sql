-- Move is_workspace_member out of the `public` schema entirely so it is
-- never exposed via PostgREST's RPC endpoint (Supabase only exposes
-- schemas listed in the API config, and `private` is not one of them) --
-- stronger than revoking grants on a public-schema function, which the
-- advisor kept flagging regardless of grant changes.
create schema if not exists private;

create function private.is_workspace_member(check_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1 from workspace_members
      where workspace_id = check_workspace_id and user_id = auth.uid()
    )
  end;
$$;

grant execute on function private.is_workspace_member(uuid) to authenticated;
revoke execute on function private.is_workspace_member(uuid) from public, anon;

alter policy "workspaces_member_access" on workspaces
  using (private.is_workspace_member(id))
  with check (private.is_workspace_member(id));

alter policy "workspace_members_member_access" on workspace_members
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

alter policy "pages_member_access" on pages
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

alter policy "notes_member_access" on notes
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

alter policy "note_tags_member_access" on note_tags
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

alter policy "tasks_member_access" on tasks
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

alter policy "blocks_member_access" on blocks
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

alter policy "page_layouts_member_access" on page_layouts
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

drop function public.is_workspace_member(uuid);
