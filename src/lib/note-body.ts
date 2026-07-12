import { parseTags } from "@/lib/routing";

export interface BodySegment {
  type: "text" | "routing-tag" | "plain-tag";
  value: string;
}

/**
 * Splits a note body into renderable segments: the leftmost tag (index 0
 * of parseTags, which is by definition the routing tag whenever one
 * exists) renders as "routing-tag"; any other tag occurrence -- whether a
 * different tag or a repeat of the same text later in the body -- renders
 * as plain "plain-tag" text, matching the design's "secondary tags render
 * as plain mono ink-faint text, no pill" rule.
 */
export function segmentNoteBody(body: string): BodySegment[] {
  const tags = parseTags(body);
  if (tags.length === 0) {
    return [{ type: "text", value: body }];
  }

  const segments: BodySegment[] = [];
  let cursor = 0;

  tags.forEach((tag, i) => {
    if (tag.index > cursor) {
      segments.push({ type: "text", value: body.slice(cursor, tag.index) });
    }
    const raw = body.slice(tag.index, tag.index + 1 + tag.tag.length);
    segments.push({ type: i === 0 ? "routing-tag" : "plain-tag", value: raw });
    cursor = tag.index + raw.length;
  });

  if (cursor < body.length) {
    segments.push({ type: "text", value: body.slice(cursor) });
  }

  return segments;
}
