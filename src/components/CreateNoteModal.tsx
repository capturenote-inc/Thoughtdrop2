"use client";

import { useEffect, useRef, useState } from "react";
import { getLeftmostTag } from "@/lib/routing";
import { segmentNoteBody } from "@/lib/note-body";
import { createNote, updateNote } from "@/lib/actions/notes";
import { TagPill } from "@/components/TagPill";
import { useMutationFeedback } from "@/lib/mutation-feedback-context";

interface PageOption {
  id: string;
  tag: string;
  title: string;
  color: string;
}

const TEXTAREA_STYLE =
  "min-h-[184px] max-h-[56vh] w-full resize-none overflow-y-auto whitespace-pre-wrap break-words px-6 py-5 text-[17px] leading-[1.75] font-sans";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const { showFeedback } = useMutationFeedback();

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]'
        ) ?? []);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
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
      showFeedback({ message: editingNoteId ? "Note updated." : matchedPage ? `Note filed in ${matchedPage.title}.` : "Note saved to Inbox.", tone: "success" });
      onClose();
    } catch {
      setError("Couldn’t save this note. Your draft is still here. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const leftmostTag = getLeftmostTag(draft);
  const matchedPage = leftmostTag ? pages.find((p) => p.tag === leftmostTag) : undefined;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="capture-dialog-title" className="absolute left-1/2 top-3 max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] -translate-x-1/2 overflow-y-auto rounded-[20px] border border-border-modal bg-bg-modal shadow-2xl sm:top-[12vh] sm:w-[min(720px,calc(100vw-40px))]">
        <div className="flex items-center justify-between px-6 pb-3 pt-5">
          <h2 id="capture-dialog-title" className="text-[14px] font-semibold tracking-[-0.015em] text-ink">{editingNoteId ? "Edit note" : "New note"}</h2>
          <button type="button" onClick={onClose} aria-label="Close note editor" className="flex h-8 items-center gap-2 rounded-lg px-2 text-[11px] text-ink-faint hover:bg-card-header hover:text-ink"><span className="hidden font-mono sm:inline">esc</span><span aria-hidden className="text-lg leading-none">×</span></button>
        </div>
        <div className="capture-paper relative mx-5 overflow-hidden rounded-[14px]">
          <div aria-hidden className={`${TEXTAREA_STYLE} pointer-events-none absolute inset-0 pb-0 text-ink`}>
            <HighlightedDraft draft={draft} />
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write it down. A #tag gives it a home."
            aria-label="Note text"
            className={`${TEXTAREA_STYLE} capture-editor relative bg-transparent text-transparent caret-amber placeholder:text-ink-ghost`}
            style={{ outline: "none" }}
          />
        </div>
        {error && <p role="alert" aria-live="assertive" className="px-6 pt-2 text-[11.5px] text-red-600">{error}</p>}
        <div className="mx-5 mb-4 mt-3 flex min-h-10 flex-wrap items-center gap-2 text-[12px]">
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
          <div className="min-w-2 flex-1" />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !draft.trim()}
            className="flex h-9 items-center gap-1.5 rounded-[10px] bg-amber px-4 text-[12.5px] font-semibold text-on-amber shadow-sm hover:bg-amber-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
            <span className="font-mono text-[10px] font-normal opacity-75">⌘↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
