-- pages_set_depth_and_validate (20260709200542) computes depth for the row
-- being inserted/updated but never cascades depth changes to descendants.
-- Moving a subtree via UPDATE parent_id would silently leave descendants'
-- stored depth stale and could push them past the 3-level cap undetected.
-- Rather than implement recursive depth propagation, "move page" is
-- pushed to post-MVP (see PHASES.md) and re-parenting is forbidden
-- outright: a page's parent can only be set at creation.
--
-- Any BEFORE trigger raising an exception aborts the whole statement, so
-- it does not matter that pages_set_depth_and_validate (which still fires
-- on "update of parent_id") may run before or after this one -- neither
-- trigger's effects are ever committed once this one raises.
create function pages_forbid_reparent()
returns trigger as $$
begin
  if new.parent_id is distinct from old.parent_id then
    raise exception 'pages cannot be re-parented after creation (post-MVP feature)';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger pages_before_update_forbid_reparent
  before update of parent_id on pages
  for each row execute function pages_forbid_reparent();
