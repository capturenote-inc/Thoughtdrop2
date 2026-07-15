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
  "min-h-[156px] w-full resize-none whitespace-pre-wrap break-words px-6 py-5 text-[17px] leading-[1.7] font-sans";

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

  // Native textareas don't grow with content; keep the writing surface and
  // its tag highlight in sync without turning an empty capture into a wall.
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
      <div className="absolute left-1/2 top-[14vh] w-[min(680px,calc(100vw-40px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border-modal bg-bg-modal shadow-2xl">
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <span className="text-[13px] font-semibold text-ink">New thought</span>
          <span className="font-mono text-[10px] text-ink-faint">esc to close</span>
        </div>
        <div className="relative mx-3 rounded-xl bg-card-header">
          <div aria-hidden className={`${TEXTAREA_STYLE} pointer-events-none absolute inset-0 pb-0 text-ink`}>
            <HighlightedDraft draft={draft} />
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write it down. A #tag gives it a home."
            className={`${TEXTAREA_STYLE} relative bg-transparent text-transparent caret-amber outline-none placeholder:text-ink-ghost focus-visible:outline-none`}
          />
        </div>
        {error && <p className="px-6 pt-2 text-[11.5px] text-red-600">{error}</p>}
        <div className="mx-3 mb-3 mt-2 flex items-center gap-1.5 rounded-xl bg-card-header px-3 pb-3 pt-2 text-[12px]">
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
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !draft.trim()}
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
