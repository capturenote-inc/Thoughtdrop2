"use client";

import { useCaptureModal } from "@/lib/capture-modal-context";

export function TodayCapture() {
  const { openCreate } = useCaptureModal();

  return (
    <button type="button" onClick={openCreate} className="group flex w-full items-center gap-4 rounded-[18px] border border-border-modal bg-bg-modal px-5 py-5 text-left shadow-[0_12px_32px_rgb(23_23_19_/_0.05)] transition hover:-translate-y-px hover:border-ink-ghost hover:shadow-[0_16px_36px_rgb(23_23_19_/_0.09)]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber text-[22px] font-light leading-none text-on-amber">+</span>
      <span className="min-w-0 flex-1 text-[16px] text-ink-faint">Capture a thought… <span className="text-[13px] text-ink-ghost">#tag routes it</span></span>
      <span className="hidden rounded-md border border-border px-2 py-1 font-mono text-[10px] text-ink-faint sm:block">⌘K</span>
    </button>
  );
}
