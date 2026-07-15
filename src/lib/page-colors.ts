export type PageColorKey = "amber" | "clay" | "rose" | "plum" | "slate" | "teal" | "sage" | "stone";

export const DEFAULT_PAGE_COLOR: PageColorKey = "amber";

export const PAGE_COLORS: Record<PageColorKey, { tint: string; ink: string; darkTint: string; darkInk: string; label: string }> = {
  amber: { tint: "#F8ECDA", ink: "#96590F", darkTint: "#382618", darkInk: "#F0B785", label: "Amber · default" },
  clay: { tint: "#F6E4DB", ink: "#9A4F33", darkTint: "#38231D", darkInk: "#EBAF94", label: "Clay" },
  rose: { tint: "#F6E2E6", ink: "#9E4A5C", darkTint: "#362027", darkInk: "#E9A7B6", label: "Rose" },
  plum: { tint: "#EDE2ED", ink: "#7B4E7E", darkTint: "#302232", darkInk: "#D2AAD5", label: "Plum" },
  slate: { tint: "#E3E9F1", ink: "#46617F", darkTint: "#202C39", darkInk: "#A9C4E0", label: "Slate blue" },
  teal: { tint: "#DFECE8", ink: "#2F6E60", darkTint: "#1D332F", darkInk: "#9BD2C3", label: "Teal" },
  sage: { tint: "#E8EEDD", ink: "#5C7038", darkTint: "#2A3020", darkInk: "#C1D69A", label: "Sage" },
  stone: { tint: "#EAE8E1", ink: "#6B6555", darkTint: "#2D2C29", darkInk: "#C5C1B5", label: "Stone" },
};

export const PAGE_COLOR_KEYS = Object.keys(PAGE_COLORS) as PageColorKey[];

export function isPageColorKey(value: string | null | undefined): value is PageColorKey {
  return typeof value === "string" && value in PAGE_COLORS;
}

export function resolvePageColor(value: string | null | undefined): PageColorKey {
  return isPageColorKey(value) ? value : DEFAULT_PAGE_COLOR;
}
