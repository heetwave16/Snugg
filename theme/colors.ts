export const colors = {
  canvas: "#F8F5F0",
  surface: "#FFFCF8",
  surfaceMuted: "#F1ECE4",
  ink: "#292724",
  inkSoft: "#716A62",
  inkFaint: "#A39B91",
  line: "#E7DFD4",
  accent: "#C95F43",
  accentDark: "#A44932",
  accentSoft: "#F4DDD5",
  sage: "#7C9681",
  night: "#202A29",
  white: "#FFFFFF",
  black: "#11100F",
  overlay: "rgba(25, 22, 19, 0.42)",
  scrim: "rgba(25, 22, 19, 0.08)",
} as const;

export type ColorName = keyof typeof colors;
