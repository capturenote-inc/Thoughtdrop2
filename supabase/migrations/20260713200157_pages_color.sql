-- Page color: a palette key, not a hex value -- the palette (tint/ink
-- pairs) lives in app code (src/lib/page-colors.ts) so hues can be tuned
-- without a data migration. The check constraint keeps the column in sync
-- with that fixed set; add a key to both places together.
alter table pages
  add column color text not null default 'amber';

alter table pages
  add constraint pages_color_valid check (
    color in ('amber', 'clay', 'rose', 'plum', 'slate', 'teal', 'sage', 'stone')
  );
