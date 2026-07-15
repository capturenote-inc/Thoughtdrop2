// Postgres SQLSTATE codes, classified for mapping to user-facing messages.
// Shared by every action that writes to a column with a check constraint
// (page_tag) or a unique constraint (workspace_id, tag).

export const PG_UNIQUE_VIOLATION = "23505";
export const PG_CHECK_VIOLATION = "23514";
export const PG_PIN_LIMIT = "PN005";

export type PgErrorKind = "unique_violation" | "check_violation" | "pin_limit" | "unknown";

export function classifyPgError(code: string | undefined | null): PgErrorKind {
  if (code === PG_UNIQUE_VIOLATION) return "unique_violation";
  if (code === PG_CHECK_VIOLATION) return "check_violation";
  if (code === PG_PIN_LIMIT) return "pin_limit";
  return "unknown";
}
