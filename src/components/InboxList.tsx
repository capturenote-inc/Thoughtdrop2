"use client";

import { useState } from "react";
import { NoteCard } from "@/components/NoteCard";
import { deleteNote, pinNote, restoreNote, unpinNote } from "@/lib/actions/notes";
import { createPageAndRouteNote } from "@/lib/actions/pages";
import { useCaptureModal } from "@/lib/capture-modal-context";
import { parseTags } from "@/lib/routing";
import { useMutationFeedback } from "@/lib/mutation-feedback-context";
import { actionErrorMessage } from "@/lib/action-error";

interface InboxNote {
  id: string;
  body: string;
  created_at: string;
  pinned_at: string | null;
  routing_tag: string | null;
  routing_unmatched: boolean;
}

export function InboxList({ notes }: { notes: InboxNote[] }) {
  const { openEdit } = useCaptureModal();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [pinning, setPinning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { showFeedback } = useMutationFeedback();

  function fixTag(note: InboxNote) {
    const first = parseTags(note.body)[0];
    if (first) {
      openEdit({ id: note.id, body: note.body }, first.index, 1 + first.tag.length);
    } else {
      openEdit({ id: note.id, body: note.body });
    }
  }

  async function handleCreateTag(note: InboxNote) {
    setErrors((prev) => ({ ...prev, [note.id]: "" }));
    setCreatingFor(note.id);
    try {
      try {
        const result = await createPageAndRouteNote(note.id, note.routing_tag as string);
        if (!result.ok) setErrors((prev) => ({ ...prev, [note.id]: result.error }));
      } catch (error) {
        setErrors((prev) => ({ ...prev, [note.id]: actionErrorMessage(error, "Couldn’t create that page. Try again.") }));
      }
    } finally {
      setCreatingFor(null);
    }
  }

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

  async function handleTogglePin(note: InboxNote) {
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
    <div className="mx-auto mb-16 mt-7 max-w-[1080px] px-6 lg:px-10">
      {notes.length === 0 ? (
        <div className="border-y border-border py-12">
          <p className="text-[17px] font-medium text-ink">Your Inbox is clear.</p>
          <p className="mt-1 text-[14px] text-ink-faint">Untagged and unmatched thoughts wait here for a decision.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const unmatched = note.routing_unmatched && Boolean(note.routing_tag);
            const error = errors[note.id];
            const busy = creatingFor === note.id || pinning === note.id || deleting === note.id;
            return (
                <div key={note.id} className="flex flex-col gap-1">
                <NoteCard
                  body={note.body}
                  createdAt={note.created_at}
                  headerTag={note.routing_tag ? { tag: note.routing_tag, unmatched } : null}
                  pinned={Boolean(note.pinned_at)}
                  footer={
                    unmatched ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleCreateTag(note)}
                          disabled={busy}
                          className="flex h-[26px] items-center rounded-md border border-amber px-[11px] font-medium text-amber-ink hover:border-ink-ghost disabled:opacity-60"
                        >
                          {creatingFor === note.id ? "Creating…" : `Create #${note.routing_tag}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => fixTag(note)}
                          disabled={busy}
                          className="flex h-[26px] items-center rounded-md border border-border px-[11px] text-ink-secondary hover:border-ink-ghost hover:text-ink disabled:opacity-60"
                        >
                          Fix tag
                        </button>
                        <div className="flex-1" />
                        <button type="button" onClick={() => void handleTogglePin(note)} disabled={busy} className="text-amber-ink hover:text-amber-hover disabled:opacity-60">
                          {pinning === note.id ? "Working…" : note.pinned_at ? "Unpin" : "Pin"}
                        </button>
                        <button type="button" onClick={() => void handleDelete(note.id)} disabled={busy} className="text-ink-secondary hover:text-ink disabled:opacity-60">
                          {deleting === note.id ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1" />
                        <button type="button" onClick={() => void handleTogglePin(note)} disabled={busy} className="text-amber-ink hover:text-amber-hover disabled:opacity-60">
                          {pinning === note.id ? "Working…" : note.pinned_at ? "Unpin" : "Pin"}
                        </button>
                        <button type="button" onClick={() => openEdit({ id: note.id, body: note.body })} disabled={busy} className="text-ink-secondary hover:text-ink disabled:opacity-60">
                          Edit
                        </button>
                        <button type="button" onClick={() => void handleDelete(note.id)} disabled={busy} className="text-ink-secondary hover:text-ink disabled:opacity-60">
                          {deleting === note.id ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    )
                  }
                />
                {error && <p className="pt-1 text-[11.5px] text-red-600">{error}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
