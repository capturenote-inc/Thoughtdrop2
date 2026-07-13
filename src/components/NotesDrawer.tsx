"use client";

import { useState } from "react";
import { NoteBody } from "@/components/NoteBody";
import { formatRelativeTime } from "@/lib/format";
import { deleteNote } from "@/lib/actions/notes";
import { useCaptureModal } from "@/lib/capture-modal-context";

interface DrawerNote {
  id: string;
  body: string;
  created_at: string;
}

export function NotesDrawer({ notes }: { notes: DrawerNote[] }) {
  // Session-only: never persisted per page (DESIGN.md D1 / SPEC vs. the
  // design README's "persist per page" note -- SPEC/DESIGN win on behavior).
  const [open, setOpen] = useState(false);
  const { openEdit } = useCaptureModal();
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleDelete(noteId: string) {
    setErrors((prev) => ({ ...prev, [noteId]: "" }));
    const result = await deleteNote(noteId);
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, [noteId]: result.error }));
    }
  }

  return (
    <div className="mx-10 mt-5 border-t border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2.5 text-[12.5px] text-ink-secondary"
      >
        <span className="text-[9px] text-ink-faint">{open ? "▼" : "▶"}</span>
        <span className="font-medium text-ink">Notes</span>
        <span className="font-mono text-[11px] text-ink-faint">({notes.length})</span>
      </button>

      {open &&
        notes.map((note) => (
          <div key={note.id} className="group border-t border-border-soft py-2 pl-[19px] text-[13px]">
            <div className="flex items-center gap-3">
              <span className="flex-1 leading-[1.45]">
                <NoteBody body={note.body} />
              </span>
              <span className="font-mono text-[10.5px] text-ink-faint">{formatRelativeTime(note.created_at)}</span>
              <button
                type="button"
                onClick={() => openEdit({ id: note.id, body: note.body })}
                className="text-[12px] text-ink-secondary opacity-0 hover:text-ink group-hover:opacity-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(note.id)}
                className="text-[12px] text-ink-secondary opacity-0 hover:text-ink group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
            {errors[note.id] && <p className="mt-1 pr-3 text-[11.5px] text-red-600">{errors[note.id]}</p>}
          </div>
        ))}
    </div>
  );
}
