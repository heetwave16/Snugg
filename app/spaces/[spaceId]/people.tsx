import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppScreen, PageBody } from "@/components/AppScreen";
import { MemberRow } from "@/components/MemberRow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getSpace, mockMembers } from "@/data/mockData";
import { colors, spacing, typography } from "@/theme";

export default function PeopleScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();
  const id = typeof spaceId === "string" ? spaceId : "goa-trip-26";
  const space = getSpace(id);

  return (
    <AppScreen tabBar tabSpaceId={space.id}>
      <ScreenHeader back subtitle={space.name} title="People" />
      <PageBody>
        <View style={styles.intro}>
          <View style={styles.icon}><Ionicons color={colors.accent} name="people-outline" size={22} /></View>
          <Text style={styles.title}>The people behind the memories.</Text>
          <Text style={styles.body}>{space.memberCount} friends making this Space together.</Text>
        </View>
        <Text style={styles.sectionLabel}>MEMBERS · {space.memberCount}</Text>
        <View>
          {mockMembers.slice(0, space.id === "goa-trip-26" ? 6 : 4).map((member) => <MemberRow key={member.id} member={member} />)}
        </View>
      </PageBody>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 48,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 33,
    maxWidth: 330,
  },
  body: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.xxl,
  },
});
