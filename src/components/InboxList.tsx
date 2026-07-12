"use client";

import { NoteBody } from "@/components/NoteBody";
import { formatRelativeTime } from "@/lib/format";
import { deleteNote } from "@/lib/actions/notes";
import { createPageAndRouteNote } from "@/lib/actions/pages";
import { useCaptureModal } from "@/lib/capture-modal-context";
import { parseTags } from "@/lib/routing";

interface InboxNote {
  id: string;
  body: string;
  created_at: string;
  routing_tag: string | null;
  routing_unmatched: boolean;
}

export function InboxList({ notes }: { notes: InboxNote[] }) {
  const { openEdit } = useCaptureModal();

  function fixTag(note: InboxNote) {
    const first = parseTags(note.body)[0];
    if (first) {
      openEdit({ id: note.id, body: note.body }, first.index, 1 + first.tag.length);
    } else {
      openEdit({ id: note.id, body: note.body });
    }
  }

  return (
    <div className="mx-10 mb-12 mt-3.5 border-t border-border">
      {notes.map((note) => {
        const unmatched = note.routing_unmatched && Boolean(note.routing_tag);
        return (
          <div key={note.id} className="flex items-center gap-3.5 border-b border-border-soft py-[11px] text-[13.5px]">
            <span className="flex-1 leading-[1.5]">
              <NoteBody body={note.body} unmatched={unmatched} />
              {unmatched && <span className="ml-1.5 text-[11.5px] text-ink-faint">— no page owns this tag</span>}
            </span>
            <span className="font-mono text-[10.5px] text-ink-faint">{formatRelativeTime(note.created_at)}</span>
            {unmatched ? (
              <>
                <button
                  type="button"
                  onClick={() => void createPageAndRouteNote(note.id, note.routing_tag as string)}
                  className="flex h-[26px] items-center rounded-md border border-amber px-[11px] text-[12px] font-medium text-amber-ink hover:border-ink-ghost"
                >
                  Create #{note.routing_tag}
                </button>
                <button
                  type="button"
                  onClick={() => fixTag(note)}
                  className="flex h-[26px] items-center rounded-md border border-border px-[11px] text-[12px] text-ink-secondary hover:border-ink-ghost hover:text-ink"
                >
                  Fix tag
                </button>
                <button
                  type="button"
                  onClick={() => void deleteNote(note.id)}
                  className="text-[12px] text-ink-secondary hover:text-ink"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openEdit({ id: note.id, body: note.body })}
                  className="text-[12px] text-ink-secondary hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteNote(note.id)}
                  className="text-[12px] text-ink-secondary hover:text-ink"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        );
      })}
      {notes.length === 0 && (
        <p className="border-b border-border-soft py-4 text-[13px] text-ink-faint">Inbox is empty.</p>
      )}
    </div>
  );
}
