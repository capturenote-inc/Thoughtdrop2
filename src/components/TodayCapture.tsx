"use client";

import { useCaptureModal } from "@/lib/capture-modal-context";

export function TodayCapture() {
  const { openCreate } = useCaptureModal();

  return (
    <button type="button" onClick={openCreate} className="group flex w-full items-center gap-3 rounded-lg border border-border-modal bg-bg-modal px-4 py-3.5 text-left transition hover:border-ink-ghost hover:bg-card-header">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber text-[18px] font-light leading-none text-on-amber">+</span>
      <span className="min-w-0 flex-1 text-[14px] text-ink-faint">Capture a thought, task, or link <span className="text-[12px] text-ink-ghost">#tag routes it</span></span>
      <span className="hidden rounded-md border border-border px-2 py-1 font-mono text-[10px] text-ink-faint sm:block">⌘K</span>
    </button>
  );
}
