import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen, PageBody } from "@/components/AppScreen";
import { Avatar } from "@/components/Avatar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mockMembers } from "@/data/mockData";
import { colors, radii, spacing, typography } from "@/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const profile = mockMembers.find((member) => member.id === "heet")!;

  return (
    <AppScreen tabBar>
      <ScreenHeader title="You" action={<View style={styles.headerDot} />} />
      <PageBody>
        <View style={styles.profileHeader}>
          <Avatar initials={profile.initials} size={82} source={profile.source} />
          <Text style={styles.name}>Heet</Text>
          <Text style={styles.email}>heet@example.com</Text>
          <Text style={styles.privateNote}>Private profile · preview data</Text>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <Pressable onPress={() => Alert.alert("Settings", "Account settings will be added in a future step.")} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.rowIcon}><Ionicons color={colors.inkSoft} name="settings-outline" size={20} /></View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Settings</Text>
            <Text style={styles.rowMeta}>Preferences and account details</Text>
          </View>
          <Ionicons color={colors.inkFaint} name="chevron-forward" size={18} />
        </Pressable>

        <Text style={[styles.sectionLabel, styles.secondLabel]}>PREVIEW</Text>
        <Pressable onPress={() => router.push("/auth")} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.rowIcon}><Ionicons color={colors.accent} name="lock-closed-outline" size={20} /></View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Authentication placeholder</Text>
            <Text style={styles.rowMeta}>See the next step in Snugg&apos;s flow</Text>
          </View>
          <Ionicons color={colors.inkFaint} name="chevron-forward" size={18} />
        </Pressable>
      </PageBody>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerDot: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.round,
    height: 10,
    width: 10,
  },
  profileHeader: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  name: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 24,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  email: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 14,
    marginTop: 3,
  },
  privateNote: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.xxl,
  },
  secondLabel: {
    marginTop: spacing.xxl,
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 66,
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: "700",
  },
  rowMeta: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});
