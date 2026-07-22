"use client";

import { useState } from "react";
import { NoteCard } from "@/components/NoteCard";
import { deleteNote, pinNote, restoreNote, unpinNote } from "@/lib/actions/notes";
import { useCaptureModal } from "@/lib/capture-modal-context";
import { useMutationFeedback } from "@/lib/mutation-feedback-context";
import { actionErrorMessage } from "@/lib/action-error";
import type { PageColorKey } from "@/lib/page-colors";

interface DrawerNote {
  id: string;
  body: string;
  created_at: string;
  pinned_at: string | null;
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
  // Session-only: never persisted per page. The stream starts open so a page
  // with captured thoughts never looks empty before Phase 3 adds blocks.
  const [open, setOpen] = useState(true);
  const { openEdit } = useCaptureModal();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pinning, setPinning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { showFeedback } = useMutationFeedback();

  async function handleDelete(noteId: string) {
    setErrors((prev) => ({ ...prev, [noteId]: "" }));
    setDeleting(noteId);
    try {
      const result = await deleteNote(noteId);
      if (!result.ok) {
        setErrors((prev) => ({ ...prev, [noteId]: result.error }));
        return;
      }
      showFeedback({
        message: "Note moved to recently deleted.",
        actionLabel: "Undo",
        action: async () => {
          const restored = await restoreNote(noteId);
          if (!restored.ok) throw new Error(restored.error);
        },
        successMessage: "Note restored.",
        errorMessage: "Couldn’t restore the note. Try again.",
      });
    } catch (error) {
      setErrors((prev) => ({ ...prev, [noteId]: actionErrorMessage(error, "Couldn’t delete this note. Try again.") }));
    } finally {
      setDeleting(null);
    }
  }

  async function handleTogglePin(note: DrawerNote) {
    setErrors((prev) => ({ ...prev, [note.id]: "" }));
    setPinning(note.id);
    try {
      try {
        const result = note.pinned_at ? await unpinNote(note.id) : await pinNote(note.id);
        if (!result.ok) setErrors((prev) => ({ ...prev, [note.id]: result.error }));
      } catch (error) {
        setErrors((prev) => ({ ...prev, [note.id]: actionErrorMessage(error, "Couldn’t update this pin. Try again.") }));
      }
    } finally {
      setPinning(null);
    }
  }

  return (
    <section className="mx-auto mt-10 max-w-[1080px] px-6 lg:px-10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-10 items-center gap-3 text-[13px] text-ink-secondary hover:text-ink"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full border border-border text-[11px] text-ink-faint" aria-hidden>{open ? "−" : "+"}</span>
        <span className="font-semibold text-ink">Recent notes</span>
        <span className="font-mono text-[11px] text-ink-faint">{notes.length}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border pb-3 pt-3">
          {notes.length === 0 ? (
            <p className="py-6 text-[14px] text-ink-faint">Nothing has landed here yet. Capture a thought with #{pageTag} to start this page.</p>
          ) : notes.map((note) => (
            <div key={note.id} className="flex flex-col gap-1">
              <NoteCard
                body={note.body}
                createdAt={note.created_at}
                headerTag={{ tag: pageTag, color: pageColor }}
                pinned={Boolean(note.pinned_at)}
                footer={
                  <>
                    <button type="button" onClick={() => void handleTogglePin(note)} disabled={pinning === note.id} className="text-amber-ink hover:text-amber-hover disabled:opacity-60">
                      {note.pinned_at ? "Unpin" : "Pin"}
                    </button>
                    <button type="button" onClick={() => openEdit({ id: note.id, body: note.body })} className="text-ink-secondary hover:text-ink">
                      Edit
                    </button>
                    <button type="button" onClick={() => void handleDelete(note.id)} disabled={deleting === note.id} className="text-ink-secondary hover:text-ink disabled:opacity-60">
                      {deleting === note.id ? "Deleting…" : "Delete"}
                    </button>
                  </>
                }
              />
              {errors[note.id] && <p className="pt-1 text-[11.5px] text-red-600">{errors[note.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
