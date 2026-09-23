import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppScreen, PageBody } from "@/components/AppScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getMedia, getSpace } from "@/data/mockData";
import { colors, spacing, typography } from "@/theme";

export default function GalleryScreen() {
  const router = useRouter();
  const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();
  const id = typeof spaceId === "string" ? spaceId : "goa-trip-26";
  const space = getSpace(id);
  const media = getMedia(space.id);

  return (
    <AppScreen>
      <ScreenHeader back subtitle={`${space.memoryCount} memories`} title="Gallery" />
      <PageBody>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>{space.name.toUpperCase()}</Text>
          <Text style={styles.title}>All the little moments.</Text>
          <Text style={styles.body}>Photos and videos shared by everyone in this Space.</Text>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterActive}>All memories</Text>
          <Text style={styles.filter}>Photos</Text>
          <Text style={styles.filter}>Videos</Text>
        </View>
        <PhotoGrid media={media} onPress={(item) => router.push({ pathname: "/media/[mediaId]", params: { mediaId: item.id } })} />
      </PageBody>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginTop: spacing.sm,
  },
  body: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  filterRow: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterActive: {
    color: colors.accentDark,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: "700",
  },
  filter: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: "600",
  },
});
