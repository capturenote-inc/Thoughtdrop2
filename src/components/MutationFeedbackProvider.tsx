"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MutationFeedbackContext, type FeedbackInput } from "@/lib/mutation-feedback-context";

interface VisibleFeedback extends FeedbackInput {
  id: number;
}

export function MutationFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<VisibleFeedback | null>(null);
  const [acting, setActing] = useState(false);
  const nextId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setFeedback(null);
    setActing(false);
  }, []);

  const showFeedback = useCallback((input: FeedbackInput) => {
    if (timer.current) clearTimeout(timer.current);
    const id = ++nextId.current;
    setFeedback({ ...input, id });
    setActing(false);
    timer.current = setTimeout(() => {
      setFeedback((current) => current?.id === id ? null : current);
      timer.current = null;
    }, input.duration ?? (input.action ? 8000 : 4200));
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function runAction() {
    if (!feedback?.action || acting) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setActing(true);
    try {
      await feedback.action();
      showFeedback({ message: feedback.successMessage ?? "Restored.", tone: "success" });
    } catch {
      showFeedback({ message: feedback.errorMessage ?? "That could not be undone. Try again.", tone: "error", duration: 6500 });
    }
  }

  return (
    <MutationFeedbackContext.Provider value={{ showFeedback }}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[80] flex justify-center sm:inset-x-auto sm:bottom-5 sm:right-5" aria-live="polite" aria-atomic="true">
        {feedback && (
          <div role={feedback.tone === "error" ? "alert" : "status"} className="pointer-events-auto flex min-h-12 w-full max-w-sm items-center gap-3 rounded-xl border border-border-modal bg-ink px-4 py-3 text-[12.5px] text-bg shadow-2xl sm:w-auto sm:min-w-72">
            <span className="min-w-0 flex-1">{feedback.message}</span>
            {feedback.action && (
              <button type="button" onClick={() => void runAction()} disabled={acting} className="shrink-0 rounded-md bg-bg/10 px-2.5 py-1.5 font-semibold text-bg hover:bg-bg/20 disabled:opacity-60">
                {acting ? "Restoring…" : feedback.actionLabel ?? "Undo"}
              </button>
            )}
            <button type="button" onClick={dismiss} aria-label="Dismiss message" className="shrink-0 text-bg/60 hover:text-bg">×</button>
          </div>
        )}
      </div>
    </MutationFeedbackContext.Provider>
  );
}
