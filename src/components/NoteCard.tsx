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

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="m5 2 6 1.6-1.6 2.1.9 3-2.1.8L7 14l-1-4.9-1.9-1.8L5 6.1V2Z" fill="currentColor" />
    </svg>
  );
}

/**
 * A note carries more than its text: its home, time, and available next
 * actions stay together in one durable object across Inbox and Pages.
 */
export function NoteCard({
  body,
  createdAt,
  headerTag,
  pinned = false,
  footer,
}: {
  body: string;
  createdAt: string;
  headerTag: NoteCardTag | null;
  pinned?: boolean;
  footer: ReactNode;
}) {
  return (
    <article className={`note-paper group relative isolate overflow-hidden rounded-[14px] px-5 py-4 transition-transform duration-150 hover:-translate-y-px ${pinned ? "note-paper-pinned" : ""}`}>
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
        {pinned && <span className="flex items-center gap-1 text-[10px] font-medium text-amber-ink"><PinIcon />Pinned</span>}
        <div className="flex-1" />
        <span className="font-mono text-[10.5px] text-ink-faint">{formatRelativeTime(createdAt)}</span>
      </div>
      <div className="max-w-4xl whitespace-pre-wrap py-3.5 text-[15.5px] leading-[1.75] text-ink-body">
        <NoteBody body={body} unmatched={headerTag?.unmatched} hideRoutingTagPill />
      </div>
      <div className="flex items-center gap-3.5 border-t border-border-soft pt-2.5 text-[11.5px]">{footer}</div>
    </article>
  );
}
