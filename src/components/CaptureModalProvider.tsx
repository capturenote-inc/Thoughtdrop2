"use client";

import { useCallback, useEffect, useState } from "react";
import { CaptureModalContext, type CaptureModalNote } from "@/lib/capture-modal-context";
import { CreateNoteModal } from "@/components/CreateNoteModal";

interface PageOption {
  id: string;
  tag: string;
  title: string;
  color: string;
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
    // ⌘K, not ⌘N: Chrome reserves ⌘N at the window level for "New Window"
    // and never dispatches it to the page, so a ⌘N handler here is
    // permanently unreachable in the browser Bryan actually uses. Accepted
    // deviation from the design bundle (which specifies ⌘N) -- logged in
    // docs/PHASES.md. Reserved combos (⌘N, ⌘T, ⌘W, ...) must be assumed
    // unusable for in-page shortcuts, not tested: automated keyboard-event
    // dispatch bypasses this reservation entirely, so it passes tests that
    // would never pass for a real user pressing the real key.
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && !isTyping) {
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
