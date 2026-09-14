export const colors = {
  navy: "#0c2340",
  navyDeep: "#081628",
  navyMuted: "#1b3654",
  red: "#c8102e",
  ucla: "#2774ae",
  silver: "#a2aaad",
  paper: "#f7f5f1",
  white: "#ffffff",
  ink: "#0c2340",
} as const;

export type CategoryColorToken = "navy" | "red" | "navy-muted" | "ucla";

export const categoryColorMap: Record<CategoryColorToken, string> = {
  navy: colors.navy,
  red: colors.red,
  "navy-muted": colors.navyMuted,
  ucla: colors.ucla,
};
