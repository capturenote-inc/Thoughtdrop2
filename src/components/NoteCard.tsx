import type { ReactNode } from "react";
import { NoteBody } from "@/components/NoteBody";
import { TagPill } from "@/components/TagPill";
import { formatRelativeTime } from "@/lib/format";
import type { PageColorKey } from "@/lib/page-colors";

export interface NoteCardTag {
  tag: string;
  color?: PageColorKey | string | null;
  unmatched?: boolean;
}

/**
 * Card v2 (design turn 4c): one component, two contexts (page drawer,
 * Inbox). Header band carries the routing tag (or an untagged/unmatched
 * label) + timestamp; footer actions belong to the card and are always
 * visible, never hover-only.
 */
export function NoteCard({
  body,
  createdAt,
  headerTag,
  footer,
}: {
  body: string;
  createdAt: string;
  headerTag: NoteCardTag | null;
  footer: ReactNode;
}) {
  return (
    <article className="group border-b border-border py-5 first:border-t">
      <div className="flex items-center gap-2.5">
        {headerTag ? (
          <TagPill
            tag={headerTag.tag}
            unmatched={headerTag.unmatched}
            color={headerTag.color}
            className="px-[7px] py-[1px] text-[11px]"
          />
        ) : (
          <span className="text-[11px] text-ink-faint">untagged</span>
        )}
        {headerTag?.unmatched && <span className="text-[11px] text-ink-faint">no page owns this tag</span>}
        <div className="flex-1" />
        <span className="font-mono text-[10.5px] text-ink-faint">{formatRelativeTime(createdAt)}</span>
      </div>
      <div className="max-w-4xl py-3 text-[15px] leading-[1.65] text-ink-body">
        <NoteBody body={body} unmatched={headerTag?.unmatched} hideRoutingTagPill />
      </div>
      <div className="flex items-center gap-3.5 text-[12px]">{footer}</div>
    </article>
  );
}
