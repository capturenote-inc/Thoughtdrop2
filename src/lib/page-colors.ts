export type PageColorKey = "amber" | "clay" | "rose" | "plum" | "slate" | "teal" | "sage" | "stone";

export const DEFAULT_PAGE_COLOR: PageColorKey = "amber";

export const PAGE_COLORS: Record<PageColorKey, { tint: string; ink: string; label: string }> = {
  amber: { tint: "#F8ECDA", ink: "#96590F", label: "Amber · default" },
  clay: { tint: "#F6E4DB", ink: "#9A4F33", label: "Clay" },
  rose: { tint: "#F6E2E6", ink: "#9E4A5C", label: "Rose" },
  plum: { tint: "#EDE2ED", ink: "#7B4E7E", label: "Plum" },
  slate: { tint: "#E3E9F1", ink: "#46617F", label: "Slate blue" },
  teal: { tint: "#DFECE8", ink: "#2F6E60", label: "Teal" },
  sage: { tint: "#E8EEDD", ink: "#5C7038", label: "Sage" },
  stone: { tint: "#EAE8E1", ink: "#6B6555", label: "Stone" },
};

export const PAGE_COLOR_KEYS = Object.keys(PAGE_COLORS) as PageColorKey[];

export function isPageColorKey(value: string | null | undefined): value is PageColorKey {
  return typeof value === "string" && value in PAGE_COLORS;
}

export function resolvePageColor(value: string | null | undefined): PageColorKey {
  return isPageColorKey(value) ? value : DEFAULT_PAGE_COLOR;
}
