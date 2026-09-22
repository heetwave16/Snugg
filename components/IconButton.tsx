import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { colors, radii } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function IconButton({
  icon,
  onPress,
  label,
  tone = "quiet",
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  tone?: "quiet" | "solid";
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "solid" ? styles.solid : styles.quiet,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons color={tone === "solid" ? colors.white : colors.ink} name={icon} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.round,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  quiet: {
    backgroundColor: colors.surfaceMuted,
  },
  solid: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
