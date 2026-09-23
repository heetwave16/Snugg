import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

export function EmptyState({ icon = "sparkles-outline", title, body }: { icon?: React.ComponentProps<typeof Ionicons>["name"]; title: string; body: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}><Ionicons color={colors.accent} name={icon} size={22} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.huge,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.round,
    height: 48,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 48,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: "700",
  },
  body: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
