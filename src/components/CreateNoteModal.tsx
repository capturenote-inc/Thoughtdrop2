"use client";

import { useEffect, useRef, useState } from "react";
import { getLeftmostTag } from "@/lib/routing";
import { segmentNoteBody } from "@/lib/note-body";
import { createNote, updateNote } from "@/lib/actions/notes";
import { TagPill } from "@/components/TagPill";

interface PageOption {
  id: string;
  tag: string;
  title: string;
  color: string;
}

const TEXTAREA_STYLE =
  "min-h-[220px] w-full resize-none whitespace-pre-wrap break-words px-7 pt-6 text-[18px] leading-[1.65] font-sans";

function HighlightedDraft({ draft }: { draft: string }) {
  const segments = segmentNoteBody(draft);
  return (
    <>
      {segments.map((segment, i) =>
        segment.type === "routing-tag" ? (
          <span key={i} className="text-amber-ink">
            {segment.value}
          </span>
        ) : (
          <span key={i}>{segment.value}</span>
        )
      )}
    </>
  );
}

export function CreateNoteModal({
  pages,
  onClose,
  initialBody = "",
  editingNoteId = null,
  focusTagIndex,
  focusTagLength,
}: {
  pages: PageOption[];
  onClose: () => void;
  initialBody?: string;
  editingNoteId?: string | null;
  focusTagIndex?: number;
  focusTagLength?: number;
}) {
  const [draft, setDraft] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    if (focusTagIndex !== undefined && focusTagLength !== undefined) {
      el.setSelectionRange(focusTagIndex, focusTagIndex + focusTagLength);
    } else {
      el.setSelectionRange(el.value.length, el.value.length);
    }
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native textareas don't grow with content; keep it (and the highlight
  // backdrop, which stretches to match via absolute inset-0) in sync with
  // scrollHeight so notes past the 150px minimum expand instead of scrolling.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  async function save() {
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = editingNoteId ? await updateNote(editingNoteId, draft) : await createNote(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const leftmostTag = getLeftmostTag(draft);
  const matchedPage = leftmostTag ? pages.find((p) => p.tag === leftmostTag) : undefined;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div className="absolute left-1/2 top-[9vh] w-[min(720px,calc(100vw-48px))] -translate-x-1/2 overflow-hidden rounded-xl border border-border-modal bg-bg-modal shadow-2xl">
        <div className="border-b border-border-soft px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-ink">Quick capture</div>
        <div className="relative">
          <div aria-hidden className={`${TEXTAREA_STYLE} pointer-events-none absolute inset-0 pb-0 text-ink`}>
            <HighlightedDraft draft={draft} />
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a thought… a #tag files it for you"
            className={`${TEXTAREA_STYLE} relative bg-transparent text-transparent caret-amber outline-none placeholder:text-ink-ghost`}
          />
        </div>
        {error && <p className="px-7 pt-2 text-[11.5px] text-red-600">{error}</p>}
        <div className="flex items-center gap-1.5 border-t border-border-soft px-7 pb-4 pt-3 text-[12px]">
          {!leftmostTag && <span className="text-ink-faint">No tag? It lands in your Inbox.</span>}
          {leftmostTag && matchedPage && (
            <span className="flex items-center gap-1.5 text-ink-secondary">
              Files to
              <TagPill tag={leftmostTag} color={matchedPage.color} className="px-[6px] py-[1px] text-[10.5px]" />→{" "}
              {matchedPage.title}
            </span>
          )}
          {leftmostTag && !matchedPage && (
            <span className="flex items-center gap-1.5 text-ink-secondary">
              <TagPill tag={leftmostTag} unmatched className="px-[6px] py-[1px] text-[10.5px]" />
              doesn&apos;t match a page yet — lands in Inbox
            </span>
          )}
          <div className="flex-1" />
          <span className="mr-3.5 font-mono text-[10px] text-ink-faint">esc</span>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-amber px-4 text-[12.5px] font-semibold text-on-amber hover:bg-amber-hover disabled:opacity-60"
          >
            Save
            <span className="font-mono text-[10px] font-normal opacity-75">⌘↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
