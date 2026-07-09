-- routing-service.ts previously ran the notes UPDATE, note_tags DELETE,
-- and note_tags INSERT as three sequential REST calls. A failure between
-- them left the database in a partially-applied state (e.g. a note with a
-- new routing_tag but stale note_tags rows). Wrapping the sequence in one
-- Postgres function makes it atomic: the whole call is one transaction.
--
-- SECURITY INVOKER (the default, stated explicitly) so every statement
-- inside still runs as the calling user and is subject to RLS exactly as
-- if the client had issued these writes directly -- this function adds
-- atomicity, not a privilege escalation.
--
-- The routing *decision* (parseTags/decideRouting in src/lib/routing.ts)
-- stays in application code and pure; this function only applies a
-- decision the caller already computed.
create function apply_note_routing(
  p_note_id uuid,
  p_page_id uuid,
  p_routing_tag text,
  p_routing_unmatched boolean,
  p_tags jsonb -- array of {"tag": text, "isRoutingTag": boolean}
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  select workspace_id into v_workspace_id from notes where id = p_note_id;

  if v_workspace_id is null then
    raise exception 'note % not found', p_note_id;
  end if;

  -- Defense in depth alongside the composite FK (notes_page_id_workspace_id_fkey):
  -- reject a cross-workspace page_id with a clear error instead of relying
  -- solely on RLS making the page invisible or the FK erroring at insert.
  if p_page_id is not null and not exists (
    select 1 from pages where id = p_page_id and workspace_id = v_workspace_id
  ) then
    raise exception 'page % does not belong to this note''s workspace', p_page_id;
  end if;

  update notes
  set page_id = p_page_id,
      routing_tag = p_routing_tag,
      routing_unmatched = p_routing_unmatched
  where id = p_note_id;

  delete from note_tags where note_id = p_note_id;

  insert into note_tags (workspace_id, note_id, tag, is_routing_tag, position)
  select
    v_workspace_id,
    p_note_id,
    (tag_entry ->> 'tag')::page_tag,
    (tag_entry ->> 'isRoutingTag')::boolean,
    ordinality - 1
  from jsonb_array_elements(p_tags) with ordinality as t (tag_entry, ordinality);
end;
$$;

grant execute on function apply_note_routing(uuid, uuid, text, boolean, jsonb) to authenticated;
revoke execute on function apply_note_routing(uuid, uuid, text, boolean, jsonb) from public, anon;
