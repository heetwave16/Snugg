import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen, PageBody } from "@/components/AppScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { getMedia, getSpace, mockAlbums } from "@/data/mockData";
import { colors, radii, spacing, typography } from "@/theme";

export default function SpaceDetailScreen() {
  const router = useRouter();
  const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();
  const id = typeof spaceId === "string" ? spaceId : "goa-trip-26";
  const space = getSpace(id);
  const media = getMedia(space.id);

  return (
    <AppScreen tabBar tabSpaceId={space.id}>
      <ScreenHeader
        action={
          <Pressable onPress={() => router.push({ pathname: "/spaces/[spaceId]/people", params: { spaceId: space.id } })} style={({ pressed }) => [styles.peopleAction, pressed && styles.pressed]}>
            <Ionicons color={colors.accentDark} name="people-outline" size={18} />
            <Text style={styles.peopleActionText}>People</Text>
          </Pressable>
        }
        back
        title={space.name}
      />
      <PageBody>
        <View style={styles.hero}>
          <Image resizeMode="cover" source={space.cover} style={styles.heroImage} />
          <View style={styles.heroScrim} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>A SHARED SPACE</Text>
            <Text style={styles.heroTitle}>{space.description}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat label="MEMORIES" value={space.memoryCount.toString()} />
          <View style={styles.statLine} />
          <Stat label="MEMBERS" value={space.memberCount.toString()} />
          <View style={styles.statLine} />
          <Stat label="UPDATED" value="Today" />
        </View>

        <Pressable onPress={() => router.push({ pathname: "/spaces/[spaceId]/gallery", params: { spaceId: space.id } })} style={({ pressed }) => [styles.galleryLink, pressed && styles.pressed]}>
          <View style={styles.galleryLinkIcon}><Ionicons color={colors.white} name="images-outline" size={20} /></View>
          <View style={styles.galleryLinkCopy}>
            <Text style={styles.galleryLinkTitle}>Open full gallery</Text>
            <Text style={styles.galleryLinkMeta}>All {space.memoryCount} memories, together</Text>
          </View>
          <Ionicons color={colors.inkFaint} name="arrow-forward" size={19} />
        </Pressable>

        <View style={styles.albumSection}>
          <SectionHeading action={<Text style={styles.viewAll}>See all</Text>} title="Albums & dates" />
          <View style={styles.albumRow}>
            {mockAlbums.map((album) => (
              <View key={album.id} style={styles.album}>
                <Image resizeMode="cover" source={album.cover} style={styles.albumImage} />
                <Text numberOfLines={1} style={styles.albumTitle}>{album.title}</Text>
                <Text style={styles.albumMeta}>{album.date}  ·  {album.count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.previewSection}>
          <SectionHeading action={<Text onPress={() => router.push({ pathname: "/spaces/[spaceId]/gallery", params: { spaceId: space.id } })} style={styles.viewAll}>View all</Text>} title="Latest memories" />
          <PhotoGrid media={media.slice(0, 6)} onPress={(item) => router.push({ pathname: "/media/[mediaId]", params: { mediaId: item.id } })} />
        </View>
      </PageBody>
    </AppScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  peopleAction: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.round,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
  },
  peopleActionText: {
    color: colors.accentDark,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: "700",
  },
  hero: {
    borderRadius: radii.xl,
    height: 205,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    height: "100%",
    width: "100%",
  },
  heroScrim: {
    backgroundColor: "rgba(24,19,14,0.24)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  heroCopy: {
    bottom: spacing.lg,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 27,
    maxWidth: 280,
  },
  stats: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.lg,
  },
  stat: {
    alignItems: "center",
    flex: 1,
    gap: 3,
  },
  statValue: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 17,
    fontWeight: "700",
  },
  statLabel: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.9,
  },
  statLine: {
    backgroundColor: colors.line,
    height: 30,
    width: 1,
  },
  galleryLink: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  galleryLinkIcon: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  galleryLinkCopy: {
    flex: 1,
    gap: 3,
  },
  galleryLinkTitle: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: "700",
  },
  galleryLinkMeta: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 12,
  },
  albumSection: {
    marginTop: spacing.xxl,
  },
  viewAll: {
    color: colors.accentDark,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: "700",
  },
  albumRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  album: {
    flex: 1,
  },
  albumImage: {
    aspectRatio: 1,
    borderRadius: radii.md,
    width: "100%",
  },
  albumTitle: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  albumMeta: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 10,
    marginTop: 2,
  },
  previewSection: {
    marginTop: spacing.xxl,
  },
  pressed: {
    opacity: 0.68,
  },
});
