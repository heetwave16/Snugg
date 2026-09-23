import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action}
    </View>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  eyebrow: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
});
