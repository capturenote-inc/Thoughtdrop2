"use client";

import { useState, useTransition } from "react";
import { TagPill } from "@/components/TagPill";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { pinPage, unpinPage, setPageColor } from "@/lib/actions/pages";
import { resolvePageColor, type PageColorKey } from "@/lib/page-colors";

function PinIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4"><path d="m15 4 5 5-3 1-3 4-3-3 4-3zM12 12l-7 7"/></svg>;
}

function PaletteIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 3a9 9 0 1 0 0 18h1.2c1 0 1.6-1.1 1.1-2-.4-.8.2-1.8 1.1-1.8h1.3A4.3 4.3 0 0 0 21 13 10 10 0 0 0 12 3Z"/><path d="M7.5 12h.01M9 7.5h.01M14.5 7.5h.01M17 12h.01" strokeWidth="2.5" strokeLinecap="round"/></svg>;
}

export function PageHeader({
  pageId,
  tag,
  title,
  color,
  pinned,
  parentTitle,
}: {
  pageId: string;
  tag: string;
  title: string;
  color: string;
  pinned: boolean;
  parentTitle: string | null;
}) {
  const [currentColor, setCurrentColor] = useState<PageColorKey>(resolvePageColor(color));
  const [isPinned, setIsPinned] = useState(pinned);
  const [pickingColor, setPickingColor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function togglePin() {
    setError(null);
    const next = !isPinned;
    setIsPinned(next);
    startTransition(async () => {
      const result = next ? await pinPage(pageId) : await unpinPage(pageId);
      if (!result.ok) {
        setIsPinned(!next);
        setError(result.error);
      }
    });
  }

  function handleColorChange(nextColor: PageColorKey) {
    const previous = currentColor;
    setCurrentColor(nextColor);
    setPickingColor(false);
    setError(null);
    startTransition(async () => {
      const result = await setPageColor(pageId, nextColor);
      if (!result.ok) {
        setCurrentColor(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 pt-10 lg:px-10">
      {parentTitle && <p className="mb-3 text-[12px] font-medium text-ink-faint">{parentTitle}</p>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="m-0 text-[40px] font-semibold tracking-[-0.045em] text-ink">{title}</h1>
        <TagPill tag={tag} color={currentColor} className="px-2.5 py-1 text-[11px]" />
        <div className="ml-auto flex items-center gap-2 text-[12px] text-ink-secondary">
          <button type="button" onClick={togglePin} disabled={pending} title={isPinned ? "Unpin page" : "Pin page"} className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 hover:border-ink-ghost hover:text-ink disabled:opacity-60">
            <PinIcon />
            <span>{isPinned ? "Unpin" : "Pin"}</span>
          </button>
          <div className="relative">
            <button type="button" onClick={() => setPickingColor((p) => !p)} title="Change page color" className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 hover:border-ink-ghost hover:text-ink">
              <PaletteIcon />
              <span>Color</span>
            </button>
            {pickingColor && (
              <div className="absolute right-0 top-10 z-10 rounded-xl border border-border-modal bg-bg-modal p-3 shadow-[0_12px_28px_rgb(23_23_19_/_0.12)]">
                <ColorSwatchPicker value={currentColor} onChange={handleColorChange} />
              </div>
            )}
          </div>
        </div>
      </div>
      {error && <p className="mt-2 text-[11.5px] text-red-600">{error}</p>}
    </div>
  );
}
