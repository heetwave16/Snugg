import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, spacing, typography } from "@/theme";

const tabs = [
  { key: "spaces", label: "Spaces", icon: "albums-outline" as const, activeIcon: "albums" as const },
  { key: "people", label: "People", icon: "people-outline" as const, activeIcon: "people" as const },
  { key: "profile", label: "You", icon: "person-outline" as const, activeIcon: "person" as const },
];

export function BottomTabBar({ spaceId = "goa-trip-26" }: { spaceId?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = tab.key === "spaces"
            ? pathname === "/spaces" || pathname.startsWith("/spaces/") && !pathname.endsWith("/people")
            : tab.key === "people"
              ? pathname.endsWith("/people")
              : pathname.startsWith("/profile");
          const destination = tab.key === "spaces"
            ? "/spaces"
            : tab.key === "people"
              ? `/spaces/${spaceId}/people`
              : "/profile";

          return (
            <Pressable
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              key={tab.key}
              onPress={() => router.push(destination as never)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <Ionicons
                color={active ? colors.accent : colors.inkFaint}
                name={active ? tab.activeIcon : tab.icon}
                size={22}
              />
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.canvas,
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    position: "absolute",
    right: 0,
  },
  bar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-around",
    minHeight: 64,
    paddingHorizontal: spacing.xs,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: 3,
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.65,
  },
});
