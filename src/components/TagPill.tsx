import type { CSSProperties } from "react";
import { PAGE_COLORS, resolvePageColor, type PageColorKey } from "@/lib/page-colors";

export function TagPill({
  tag,
  unmatched = false,
  color,
  className = "",
}: {
  tag: string;
  unmatched?: boolean;
  // Unmatched pills stay amber always (SPEC v1.6) -- color is ignored
  // whenever unmatched is true, never read as a fallback.
  color?: PageColorKey | string | null;
  className?: string;
}) {
  const palette = PAGE_COLORS[unmatched ? "amber" : resolvePageColor(color)];
  return (
    <span
      style={{ "--tag-tint": palette.tint, "--tag-ink": palette.ink, "--tag-tint-dark": palette.darkTint, "--tag-ink-dark": palette.darkInk } as CSSProperties}
      className={`tag-pill inline-flex items-center rounded-full font-mono ${
        unmatched ? "border border-dashed border-amber-dashed" : ""
      } ${className}`}
    >
      #{tag}
    </span>
  );
}
