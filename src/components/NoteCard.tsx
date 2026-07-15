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
 * A note carries more than its text: its home, time, and available next
 * actions stay together in one durable object across Inbox and Pages.
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
    <article className="group rounded-lg border border-border bg-bg-card px-4 py-4 transition-colors hover:border-ink-ghost">
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
      <div className="max-w-4xl py-3 text-[14px] leading-[1.65] text-ink-body">
        <NoteBody body={body} unmatched={headerTag?.unmatched} hideRoutingTagPill />
      </div>
      <div className="flex items-center gap-3.5 text-[12px]">{footer}</div>
    </article>
  );
}
