-- Pinned = non-null timestamp; top-bar order is by pinned_at (oldest pin
-- first, per design). The 5-pin cap is primarily enforced in the pin
-- server action (which returns a structured error), but a trigger
-- backstop keeps the invariant true even against direct SQL/concurrent
-- requests, matching the atomic-routing-RPC precedent of not trusting
-- app-layer checks alone for data integrity.
alter table pages
  add column pinned_at timestamptz;

create index pages_pinned_at_idx on pages (workspace_id, pinned_at) where pinned_at is not null;

create function pages_enforce_pin_limit()
returns trigger as $$
declare
  pinned_count int;
begin
  if new.pinned_at is null or old.pinned_at is not null then
    return new;
  end if;

  select count(*) into pinned_count
  from pages
  where workspace_id = new.workspace_id and pinned_at is not null;

  if pinned_count >= 5 then
    -- Custom SQLSTATE (not the generic P0001 every bare RAISE EXCEPTION
    -- shares) so the app layer can distinguish this from other errors
    -- without matching on message text.
    raise exception 'a workspace may not have more than 5 pinned pages' using errcode = 'PN005';
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

create trigger pages_before_update_enforce_pin_limit
  before update of pinned_at on pages
  for each row execute function pages_enforce_pin_limit();
