// Pure tag-parsing and routing-decision logic. No database or I/O calls
// live here so the rules in SPEC.md's "Decision: routing rules" section can
// be unit tested without any infrastructure. Database interaction lives in
// routing-service.ts, a thin layer around these functions.

const TAG_BODY = "[a-zA-Z][a-zA-Z0-9_-]{0,63}";
const TAG_PATTERN = new RegExp(`(?:^|(?<=\\s))#(${TAG_BODY})`, "g");

export interface ParsedTag {
  /** Lowercase tag text, without the leading '#'. */
  tag: string;
  /** Character offset of the '#' in the note body. */
  index: number;
}

/**
 * Finds every hashtag in `body` per the SPEC tag syntax:
 * `#[a-zA-Z][a-zA-Z0-9_-]{0,63}`, preceded by start-of-text or whitespace.
 * Mid-word occurrences (`foo#bar`) and URL fragments (`https://x.com#tag`)
 * are excluded by the same rule, since neither is preceded by whitespace
 * or start-of-text. Case-insensitive; results are lowercased.
 */
export function parseTags(body: string): ParsedTag[] {
  const matches: ParsedTag[] = [];
  for (const match of body.matchAll(TAG_PATTERN)) {
    matches.push({
      tag: match[1].toLowerCase(),
      index: match.index,
    });
  }
  return matches;
}

/**
 * The routing tag is the leftmost hashtag in the note body (SPEC:
 * "Decision: routing rules"), or null if the note has no tags.
 */
export function getLeftmostTag(body: string): string | null {
  const tags = parseTags(body);
  return tags.length > 0 ? tags[0].tag : null;
}

export type RoutingAction =
  | { type: "unchanged" }
  | { type: "route_to_page"; pageId: string; routingTag: string }
  | { type: "route_to_inbox_unmatched"; routingTag: string }
  | { type: "route_to_inbox_no_tag" };

export interface DecideRoutingInput {
  /** The leftmost tag freshly parsed from the note's current body. */
  newLeftmostTag: string | null;
  /** The routing tag string stored on the note from its last routing decision. */
  storedRoutingTag: string | null;
  /**
   * The id of the page owning `newLeftmostTag` in this workspace, or null
   * if no such page exists. Callers resolve this via a lookup before
   * calling decideRouting -- this function never touches the database.
   * Ignored when newLeftmostTag is null.
   */
  matchedPageId: string | null;
}

/**
 * Implements the SPEC re-route trigger rule: routing is re-evaluated only
 * when the freshly parsed leftmost tag differs from the note's stored
 * routing tag string. If unchanged, the note keeps its current assignment
 * whatever that is.
 *
 * This single comparison is what makes rename (page tag changes, but the
 * note's own text and stored routing tag do not), delete-during-edit (the
 * delete already moved the note to the Inbox before this save runs), and
 * freed-tag reuse (a new page claims an old tag, but notes previously
 * flagged unmatched under that tag are not touched until they are
 * themselves saved with a *different* leftmost tag) all resolve correctly
 * without special-casing any of them. An implementation that re-resolves
 * matchedPageId and reroutes on every save -- even when the tag string is
 * unchanged -- will silently violate the freed-tag-reuse and
 * delete-during-edit rules while still passing naive tests.
 */
export function decideRouting(input: DecideRoutingInput): RoutingAction {
  const { newLeftmostTag, storedRoutingTag, matchedPageId } = input;

  if (newLeftmostTag === storedRoutingTag) {
    return { type: "unchanged" };
  }

  if (newLeftmostTag === null) {
    return { type: "route_to_inbox_no_tag" };
  }

  if (matchedPageId !== null) {
    return { type: "route_to_page", pageId: matchedPageId, routingTag: newLeftmostTag };
  }

  return { type: "route_to_inbox_unmatched", routingTag: newLeftmostTag };
}
