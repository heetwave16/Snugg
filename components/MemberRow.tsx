import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import type { Member } from "@/types";
import { colors, spacing, typography } from "@/theme";

export function MemberRow({ member, showChevron = false }: { member: Member; showChevron?: boolean }) {
  return (
    <View style={styles.row}>
      <Avatar initials={member.initials} size={46} source={member.source} />
      <View style={styles.copy}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.meta}>{member.uploads} uploads{member.role ? `  ·  ${member.role}` : ""}</Text>
      </View>
      {showChevron ? <Ionicons color={colors.inkFaint} name="chevron-forward" size={18} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 12,
  },
});
