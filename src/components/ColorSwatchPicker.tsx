"use client";

import { PAGE_COLORS, PAGE_COLOR_KEYS, type PageColorKey } from "@/lib/page-colors";

export function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: PageColorKey;
  onChange: (color: PageColorKey) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {PAGE_COLOR_KEYS.map((key) => {
        const palette = PAGE_COLORS[key];
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            title={palette.label}
            aria-label={palette.label}
            aria-pressed={selected}
            onClick={() => onChange(key)}
            className="h-[18px] w-[18px] rounded-full"
            style={{
              backgroundColor: palette.tint,
              border: selected ? `2px solid ${palette.ink}` : "1px solid var(--color-border)",
            }}
          />
        );
      })}
    </div>
  );
}
