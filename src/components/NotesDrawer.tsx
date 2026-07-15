"use client";

import { useState } from "react";
import { NoteCard } from "@/components/NoteCard";
import { deleteNote } from "@/lib/actions/notes";
import { useCaptureModal } from "@/lib/capture-modal-context";
import type { PageColorKey } from "@/lib/page-colors";

interface DrawerNote {
  id: string;
  body: string;
  created_at: string;
}

export function NotesDrawer({
  notes,
  pageTag,
  pageColor,
}: {
  notes: DrawerNote[];
  pageTag: string;
  pageColor: PageColorKey;
}) {
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

      {open && (
        <div className="grid grid-cols-2 gap-3.5 pb-4 min-[1280px]:grid-cols-3">
          {notes.map((note) => (
            <div key={note.id} className="flex flex-col gap-1.5">
              <NoteCard
                body={note.body}
                createdAt={note.created_at}
                headerTag={{ tag: pageTag, color: pageColor }}
                footer={
                  <>
                    <button type="button" onClick={() => openEdit({ id: note.id, body: note.body })} className="text-ink-secondary hover:text-ink">
                      Edit
                    </button>
                    <button type="button" onClick={() => void handleDelete(note.id)} className="text-ink-secondary hover:text-ink">
                      Delete
                    </button>
                  </>
                }
              />
              {errors[note.id] && <p className="px-1 text-[11.5px] text-red-600">{errors[note.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
