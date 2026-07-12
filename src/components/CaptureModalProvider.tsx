"use client";

import { useCallback, useEffect, useState } from "react";
import { CaptureModalContext, type CaptureModalNote } from "@/lib/capture-modal-context";
import { CreateNoteModal } from "@/components/CreateNoteModal";

interface PageOption {
  id: string;
  tag: string;
  title: string;
}

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; note: CaptureModalNote; focusTagIndex?: number; focusTagLength?: number };

export function CaptureModalProvider({
  pages,
  children,
}: {
  pages: PageOption[];
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ModalState>({ mode: "closed" });

  const openCreate = useCallback(() => setState({ mode: "create" }), []);
  const openEdit = useCallback(
    (note: CaptureModalNote, focusTagIndex?: number, focusTagLength?: number) =>
      setState({ mode: "edit", note, focusTagIndex, focusTagLength }),
    []
  );
  const close = useCallback(() => setState({ mode: "closed" }), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n" && !isTyping) {
        e.preventDefault();
        setState({ mode: "create" });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CaptureModalContext.Provider value={{ openCreate, openEdit }}>
      {children}
      {state.mode !== "closed" && (
        <CreateNoteModal
          pages={pages}
          onClose={close}
          initialBody={state.mode === "edit" ? state.note.body : ""}
          editingNoteId={state.mode === "edit" ? state.note.id : null}
          focusTagIndex={state.mode === "edit" ? state.focusTagIndex : undefined}
          focusTagLength={state.mode === "edit" ? state.focusTagLength : undefined}
        />
      )}
    </CaptureModalContext.Provider>
  );
}
