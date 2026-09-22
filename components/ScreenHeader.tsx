import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/BrandMark";
import { IconButton } from "@/components/IconButton";
import { colors, spacing, typography } from "@/theme";

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  action,
  brand = false,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
  brand?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
      <View style={styles.leading}>
        {back ? (
          <IconButton icon="arrow-back" label="Go back" onPress={() => router.back()} />
        ) : null}
        {brand ? <BrandMark compact /> : null}
        {title ? (
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        ) : null}
      </View>
      {action ?? <View style={styles.actionSpacer} />}
    </View>
  );
}

export function HeaderAction({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  return <IconButton icon={icon} label={label} onPress={onPress} />;
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 76,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  leading: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  titleBlock: {
    flexShrink: 1,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 12,
    marginTop: 2,
  },
  actionSpacer: {
    height: 40,
    width: 40,
  },
});
