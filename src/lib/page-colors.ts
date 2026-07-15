export type PageColorKey = "amber" | "clay" | "rose" | "plum" | "slate" | "teal" | "sage" | "stone";

export const DEFAULT_PAGE_COLOR: PageColorKey = "amber";

export const PAGE_COLORS: Record<PageColorKey, { tint: string; ink: string; darkTint: string; darkInk: string; label: string }> = {
  amber: { tint: "#FCE8D1", ink: "#7A3E08", darkTint: "#382618", darkInk: "#F0B785", label: "Amber · default" },
  clay: { tint: "#F9E0D4", ink: "#883A21", darkTint: "#38231D", darkInk: "#EBAF94", label: "Clay" },
  rose: { tint: "#F9DCE3", ink: "#8F354C", darkTint: "#362027", darkInk: "#E9A7B6", label: "Rose" },
  plum: { tint: "#F0DFF1", ink: "#643769", darkTint: "#302232", darkInk: "#D2AAD5", label: "Plum" },
  slate: { tint: "#DCE8F5", ink: "#2D506F", darkTint: "#202C39", darkInk: "#A9C4E0", label: "Slate blue" },
  teal: { tint: "#D8F0E9", ink: "#13594D", darkTint: "#1D332F", darkInk: "#9BD2C3", label: "Teal" },
  sage: { tint: "#E4F0D5", ink: "#466126", darkTint: "#2A3020", darkInk: "#C1D69A", label: "Sage" },
  stone: { tint: "#ECE9E1", ink: "#504B3D", darkTint: "#2D2C29", darkInk: "#C5C1B5", label: "Stone" },
};

export const PAGE_COLOR_KEYS = Object.keys(PAGE_COLORS) as PageColorKey[];

export function isPageColorKey(value: string | null | undefined): value is PageColorKey {
  return typeof value === "string" && value in PAGE_COLORS;
}

export function resolvePageColor(value: string | null | undefined): PageColorKey {
  return isPageColorKey(value) ? value : DEFAULT_PAGE_COLOR;
}
