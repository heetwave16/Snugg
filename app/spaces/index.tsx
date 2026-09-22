import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen, PageBody } from "@/components/AppScreen";
import { Avatar } from "@/components/Avatar";
import { FeaturedSpaceCard, SpaceListCard } from "@/components/SpaceCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { mockMembers, mockSpaces } from "@/data/mockData";
import { colors, radii, spacing, typography } from "@/theme";

export default function SpacesScreen() {
  const router = useRouter();
  const featuredSpace = mockSpaces[0]!;
  const otherSpaces = mockSpaces.slice(1);
  const profile = mockMembers.find((member) => member.id === "heet")!;

  return (
    <AppScreen tabBar>
      <ScreenHeader
        action={
          <Avatar
            initials={profile.initials}
            size={38}
            source={profile.source}
          />
        }
        brand
      />
      <PageBody>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>YOUR LITTLE CORNER OF THE INTERNET</Text>
          <Text style={styles.title}>Keep the good stuff close.</Text>
          <Text style={styles.body}>Private spaces for the people and moments you never want to lose.</Text>
        </View>

        <FeaturedSpaceCard
          onPress={() => router.push({ pathname: "/spaces/[spaceId]", params: { spaceId: featuredSpace.id } })}
          space={featuredSpace}
        />

        <View style={styles.sectionTop}>
          <SectionHeading
            action={<Text style={styles.count}>{mockSpaces.length} spaces</Text>}
            title="Your spaces"
          />
          {otherSpaces.map((space) => (
            <SpaceListCard
              key={space.id}
              onPress={() => router.push({ pathname: "/spaces/[spaceId]", params: { spaceId: space.id } })}
              space={space}
            />
          ))}
        </View>

        <Pressable
          accessibilityLabel="Create a new Space"
          accessibilityRole="button"
          onPress={() => Alert.alert("Create a Space", "Space creation is intentionally a visual placeholder for now.")}
          style={({ pressed }) => [styles.createWrap, pressed && styles.pressed]}
        >
          <View style={styles.createIcon}><Ionicons color={colors.accent} name="add" size={22} /></View>
          <View style={styles.createCopy}>
            <Text style={styles.createTitle}>Create a new Space</Text>
            <Text style={styles.createMeta}>Bring your people together</Text>
          </View>
          <Ionicons color={colors.inkFaint} name="arrow-forward" size={18} />
        </Pressable>
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
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.9,
    lineHeight: 34,
    maxWidth: 300,
  },
  body: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 330,
  },
  sectionTop: {
    marginTop: spacing.xxl,
  },
  count: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: "600",
  },
  createWrap: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  createIcon: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  createCopy: {
    flex: 1,
    gap: 3,
  },
  createTitle: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: "700",
  },
  createMeta: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.68,
  },
});
