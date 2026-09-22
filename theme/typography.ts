import { Platform } from "react-native";

const systemFont = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

export const typography = {
  family: systemFont,
  display: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "700" as const,
    letterSpacing: -1.2,
  },
  title: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "700" as const,
    letterSpacing: -0.6,
  },
  section: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700" as const,
    letterSpacing: 1.1,
  },
} as const;
