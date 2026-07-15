-- The former pin-limit trigger counted pinned pages without serializing
-- concurrent updates. Two tabs could both see four pins and each create a
-- fifth, leaving six pinned pages. Serialize pin attempts per workspace so
-- the second transaction observes the first transaction's committed pin.
create or replace function pages_enforce_pin_limit()
returns trigger as $$
declare
  pinned_count int;
begin
  if new.pinned_at is null or old.pinned_at is not null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.workspace_id::text, 0));

  select count(*) into pinned_count
  from pages
  where workspace_id = new.workspace_id and pinned_at is not null;

  if pinned_count >= 5 then
    raise exception 'a workspace may not have more than 5 pinned pages' using errcode = 'PN005';
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;
