-- Pin search_path on every function to prevent search_path hijacking
-- (a caller-controlled search_path could otherwise shadow an unqualified
-- table/function reference with an object from another schema).
alter function set_updated_at() set search_path = public;
alter function pages_release_notes_before_delete() set search_path = public;
alter function pages_set_depth_and_validate() set search_path = public;
alter function tasks_sync_page_from_block() set search_path = public;

-- handle_new_user_workspace is invoked solely by the auth.users trigger
-- and declared `returns trigger`, so Postgres already refuses to call it
-- directly (SQL/RPC) regardless of grants -- revoke anyway as defense in
-- depth and to clear the linter warning.
--
-- is_workspace_member's execute grant is deliberately left untouched: RLS
-- policies evaluate their USING/WITH CHECK clauses as the querying role,
-- so authenticated needs EXECUTE on it or every policy that calls it
-- breaks. A direct RPC call only ever reveals the caller's own membership
-- in a workspace id they already have to guess, scoped to auth.uid() --
-- low enough risk to accept in exchange for RLS staying functional.
revoke execute on function handle_new_user_workspace() from public, anon, authenticated;

-- Covering index for the workspace_members -> auth.users FK, used on every
-- login-scoped lookup via is_workspace_member().
create index workspace_members_user_id_idx on workspace_members (user_id);
