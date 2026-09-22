import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Space } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

export function FeaturedSpaceCard({ space, onPress }: { space: Space; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`Open ${space.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.featured, pressed && styles.pressed]}
    >
      <Image resizeMode="cover" source={space.cover} style={styles.featuredImage} />
      <View style={styles.featuredScrim} />
      <View style={styles.featuredContent}>
        <Text style={styles.featuredEyebrow}>YOUR LATEST SPACE</Text>
        <Text style={styles.featuredTitle}>{space.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.featuredMeta}>{space.memoryCount} memories</Text>
          <View style={styles.dot} />
          <Text style={styles.featuredMeta}>{space.memberCount} members</Text>
        </View>
      </View>
      <View style={styles.arrow}><Ionicons color={colors.white} name="arrow-forward" size={18} /></View>
    </Pressable>
  );
}

export function SpaceListCard({ space, onPress }: { space: Space; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`Open ${space.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}
    >
      <Image resizeMode="cover" source={space.cover} style={styles.listImage} />
      <View style={styles.listCopy}>
        <Text numberOfLines={1} style={styles.listTitle}>{space.name}</Text>
        <Text numberOfLines={1} style={styles.listDescription}>{space.description}</Text>
        <Text style={styles.listMeta}>{space.memoryCount} memories  ·  {space.memberCount} members</Text>
      </View>
      <Ionicons color={colors.inkFaint} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  featured: {
    borderRadius: radii.xl,
    height: 252,
    overflow: "hidden",
    position: "relative",
  },
  featuredImage: {
    height: "100%",
    width: "100%",
  },
  featuredScrim: {
    backgroundColor: "rgba(26, 20, 14, 0.30)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  featuredContent: {
    bottom: spacing.lg,
    left: spacing.lg,
    position: "absolute",
  },
  featuredEyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  featuredTitle: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  featuredMeta: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: "600",
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 3,
    height: 4,
    marginHorizontal: 8,
    width: 4,
  },
  arrow: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.38)",
    borderRadius: radii.round,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg,
    width: 36,
  },
  listCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  listImage: {
    borderRadius: radii.md,
    height: 78,
    width: 78,
  },
  listCopy: {
    flex: 1,
    gap: 3,
  },
  listTitle: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: "700",
  },
  listDescription: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 12,
  },
  listMeta: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
