import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/BrandMark";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, spacing, typography } from "@/theme";

export default function AuthPlaceholderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, spacing.xl), paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
      <StatusBar style="dark" />
      <BrandMark />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>AUTHENTICATION PLACEHOLDER</Text>
        <Text style={styles.title}>Your people, in one private place.</Text>
        <Text style={styles.body}>
          This is where sign in and invite flows will live. For now, take a look around Snugg with local preview content.
        </Text>
        <View style={styles.rule} />
        <PrimaryButton label="Continue to preview" icon="arrow-forward" onPress={() => router.replace("/spaces")} />
        <Text style={styles.note} onPress={() => Alert.alert("Coming soon", "Authentication will be added in the next foundation step.")}>Sign in will be available soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.canvas,
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 430,
    width: "100%",
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1,
    lineHeight: 39,
    maxWidth: 340,
  },
  body: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
    maxWidth: 350,
  },
  rule: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.xxl,
    width: 48,
  },
  note: {
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 12,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
