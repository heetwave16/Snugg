import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MediaItem } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

export function MediaViewerPlaceholder({ item }: { item: MediaItem }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image resizeMode="contain" source={item.source} style={styles.image} />
      <Pressable accessibilityLabel="Close media viewer" onPress={() => router.back()} style={[styles.close, { top: insets.top + spacing.sm }]}>
        <Ionicons color={colors.white} name="close" size={23} />
      </Pressable>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View>
          <Text style={styles.label}>MEDIA VIEWER PLACEHOLDER</Text>
          <Text style={styles.date}>{item.dateLabel}  ·  {item.kind === "video" ? "Video preview" : "Photo"}</Text>
        </View>
        <Ionicons color={colors.white} name={item.kind === "video" ? "play-circle-outline" : "expand-outline"} size={24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.black,
    flex: 1,
  },
  image: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  close: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: radii.round,
    height: 42,
    justifyContent: "center",
    position: "absolute",
    right: spacing.lg,
    width: 42,
  },
  footer: {
    alignItems: "flex-end",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: spacing.lg,
    position: "absolute",
    right: 0,
  },
  label: {
    color: "rgba(255,255,255,0.58)",
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  date: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
});
