create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Every new auth user gets exactly one workspace with themselves as owner.
-- MVP is single-workspace/single-member; the table shape already supports
-- more members per workspace so team features can land without a schema
-- change.
create function handle_new_user_workspace()
returns trigger as $$
declare
  new_workspace_id uuid;
begin
  insert into workspaces (name)
  values (coalesce(split_part(new.email, '@', 1), 'My Workspace') || '''s Workspace')
  returning id into new_workspace_id;

  insert into workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user_workspace();

-- Backfill any auth users that already exist and don't yet have a workspace
-- (relevant only to this already-provisioned project; a no-op on a fresh DB).
do $$
declare
  existing_user record;
  new_workspace_id uuid;
begin
  for existing_user in
    select u.id, u.email
    from auth.users u
    where not exists (
      select 1 from workspace_members m where m.user_id = u.id
    )
  loop
    insert into workspaces (name)
    values (coalesce(split_part(existing_user.email, '@', 1), 'My Workspace') || '''s Workspace')
    returning id into new_workspace_id;

    insert into workspace_members (workspace_id, user_id, role)
    values (new_workspace_id, existing_user.id, 'owner');
  end loop;
end;
$$;
