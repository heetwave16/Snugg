import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "filled",
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "filled" | "outline";
}) {
  const filled = variant === "filled";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, filled ? styles.filled : styles.outline, pressed && styles.pressed]}
    >
      {icon ? <Ionicons color={filled ? colors.white : colors.accent} name={icon} size={17} /> : null}
      <Text style={[styles.label, filled ? styles.filledLabel : styles.outlineLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.round,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  filled: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: colors.line,
    borderWidth: 1,
  },
  label: {
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: "700",
  },
  filledLabel: {
    color: colors.white,
  },
  outlineLabel: {
    color: colors.accentDark,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
