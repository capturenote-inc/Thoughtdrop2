-- Single-column FKs (e.g. notes.page_id references pages(id)) only check
-- that the referenced row exists *somewhere*, not that it belongs to the
-- same workspace as the referencing row. RLS alone doesn't catch this
-- either: the notes policy only validates notes.workspace_id, never that
-- notes.page_id points at a page in that same workspace. A composite FK
-- against (id, workspace_id) makes cross-workspace references impossible
-- to insert in the first place, independent of RLS or application code.
--
-- MATCH SIMPLE (Postgres's default) is what we want here: when the
-- nullable half of a composite FK (page_id, block_id) is null, the
-- constraint is trivially satisfied regardless of workspace_id, which is
-- exactly the Inbox case (no page/block to check against).
alter table pages add constraint pages_id_workspace_id_key unique (id, workspace_id);
alter table notes add constraint notes_id_workspace_id_key unique (id, workspace_id);
alter table blocks add constraint blocks_id_workspace_id_key unique (id, workspace_id);

alter table notes drop constraint notes_page_id_fkey;
alter table notes add constraint notes_page_id_workspace_id_fkey
  foreign key (page_id, workspace_id) references pages (id, workspace_id) on delete set null;

alter table note_tags drop constraint note_tags_note_id_fkey;
alter table note_tags add constraint note_tags_note_id_workspace_id_fkey
  foreign key (note_id, workspace_id) references notes (id, workspace_id) on delete cascade;

alter table blocks drop constraint blocks_page_id_fkey;
alter table blocks add constraint blocks_page_id_workspace_id_fkey
  foreign key (page_id, workspace_id) references pages (id, workspace_id) on delete cascade;

alter table page_layouts drop constraint page_layouts_page_id_fkey;
alter table page_layouts add constraint page_layouts_page_id_workspace_id_fkey
  foreign key (page_id, workspace_id) references pages (id, workspace_id) on delete cascade;

alter table tasks drop constraint tasks_page_id_fkey;
alter table tasks add constraint tasks_page_id_workspace_id_fkey
  foreign key (page_id, workspace_id) references pages (id, workspace_id) on delete set null;

alter table tasks drop constraint tasks_block_id_fkey;
alter table tasks add constraint tasks_block_id_workspace_id_fkey
  foreign key (block_id, workspace_id) references blocks (id, workspace_id) on delete cascade;
