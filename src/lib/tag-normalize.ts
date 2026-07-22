// Pure normalizer/validator for standalone user-typed tags (page creation,
// the Inbox "[Create #tag]" triage action). Distinct from routing.ts's
// parseTags: that extracts tags embedded in free-form note text; this
// validates a single tag a user typed into a dedicated field. Mirrors the
// `page_tag` Postgres domain exactly (supabase/migrations/20260709200542_pages.sql:
// `check (value ~ '^[a-z][a-z0-9_-]{0,63}$')`) so client-side validation
// never diverges from what the database will actually accept.

const TAG_FORMAT = /^[a-z][a-z0-9_-]{0,63}$/;

/** Trim, strip one leading '#', lowercase. Never throws. */
export function normalizeTagInput(input: string): string {
  return input.trim().replace(/^#/, "").toLowerCase();
}

/** True if `tag` (already normalized) satisfies the page_tag domain. */
export function isValidTag(tag: string): boolean {
  return TAG_FORMAT.test(tag);
}

/** Suggest an editable page tag from a title while staying inside page_tag. */
export function suggestTagFromTitle(title: string): string {
  const plain = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!plain) return "";
  const startsWithLetter = /^[a-z]/.test(plain) ? plain : `page-${plain}`;
  return startsWithLetter.slice(0, 64).replace(/-+$/g, "");
}

export const TAG_FORMAT_HELP = "Letters, digits, - and _, starting with a letter. The # is added for you.";

export const TAG_FORMAT_ERROR =
  "Tags are letters, digits, - and _, starting with a letter — the # is added for you.";

export const TAG_DUPLICATE_ERROR = "That tag is already in use.";
