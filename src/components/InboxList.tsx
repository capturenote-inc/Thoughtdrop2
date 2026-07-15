"use client";

import { useState } from "react";
import { NoteCard } from "@/components/NoteCard";
import { deleteNote, pinNote, unpinNote } from "@/lib/actions/notes";
import { createPageAndRouteNote } from "@/lib/actions/pages";
import { useCaptureModal } from "@/lib/capture-modal-context";
import { parseTags } from "@/lib/routing";

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
      const result = await createPageAndRouteNote(note.id, note.routing_tag as string);
      if (!result.ok) {
        setErrors((prev) => ({ ...prev, [note.id]: result.error }));
      }
    } finally {
      setCreatingFor(null);
    }
  }

  async function handleDelete(noteId: string) {
    setErrors((prev) => ({ ...prev, [noteId]: "" }));
    const result = await deleteNote(noteId);
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, [noteId]: result.error }));
    }
  }

  async function handleTogglePin(note: InboxNote) {
    setErrors((prev) => ({ ...prev, [note.id]: "" }));
    setPinning(note.id);
    try {
      const result = note.pinned_at ? await unpinNote(note.id) : await pinNote(note.id);
      if (!result.ok) setErrors((prev) => ({ ...prev, [note.id]: result.error }));
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
                          disabled={creatingFor === note.id}
                          className="flex h-[26px] items-center rounded-md border border-amber px-[11px] font-medium text-amber-ink hover:border-ink-ghost disabled:opacity-60"
                        >
                          Create #{note.routing_tag}
                        </button>
                        <button
                          type="button"
                          onClick={() => fixTag(note)}
                          className="flex h-[26px] items-center rounded-md border border-border px-[11px] text-ink-secondary hover:border-ink-ghost hover:text-ink"
                        >
                          Fix tag
                        </button>
                        <div className="flex-1" />
                        <button type="button" onClick={() => void handleTogglePin(note)} disabled={pinning === note.id} className="text-amber-ink hover:text-amber-hover disabled:opacity-60">
                          {note.pinned_at ? "Unpin" : "Pin"}
                        </button>
                        <button type="button" onClick={() => void handleDelete(note.id)} className="text-ink-secondary hover:text-ink">
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1" />
                        <button type="button" onClick={() => void handleTogglePin(note)} disabled={pinning === note.id} className="text-amber-ink hover:text-amber-hover disabled:opacity-60">
                          {note.pinned_at ? "Unpin" : "Pin"}
                        </button>
                        <button type="button" onClick={() => openEdit({ id: note.id, body: note.body })} className="text-ink-secondary hover:text-ink">
                          Edit
                        </button>
                        <button type="button" onClick={() => void handleDelete(note.id)} className="text-ink-secondary hover:text-ink">
                          Delete
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
