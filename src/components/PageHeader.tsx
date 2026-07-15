"use client";

import { useState, useTransition } from "react";
import { TagPill } from "@/components/TagPill";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { pinPage, unpinPage, setPageColor } from "@/lib/actions/pages";
import { resolvePageColor, type PageColorKey } from "@/lib/page-colors";

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
    <div className="px-10 pt-9">
      <div className="flex items-baseline gap-3.5">
        {parentTitle && <span className="text-[12px] text-ink-faint">{parentTitle} /</span>}
        <h1 className="m-0 text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        <TagPill tag={tag} color={currentColor} className="px-[9px] py-[2px] text-[12px]" />
        <div className="flex items-center gap-3 text-[12px] text-ink-secondary">
          <button type="button" onClick={togglePin} disabled={pending} className="hover:text-ink disabled:opacity-60">
            {isPinned ? "Unpin" : "Pin"}
          </button>
          <div className="relative">
            <button type="button" onClick={() => setPickingColor((p) => !p)} className="hover:text-ink">
              Color
            </button>
            {pickingColor && (
              <div className="absolute left-0 top-6 z-10 rounded-md border border-border-modal bg-bg-modal p-2.5">
                <ColorSwatchPicker value={currentColor} onChange={handleColorChange} />
              </div>
            )}
          </div>
        </div>
      </div>
      {error && <p className="mt-1.5 text-[11.5px] text-red-600">{error}</p>}
    </div>
  );
}
