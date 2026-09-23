import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/theme";

export function BrandMark({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <View style={styles.row} accessibilityLabel="Snugg">
      <View style={[styles.symbol, compact && styles.symbolCompact]}>
        <View style={[styles.dot, styles.dotBack, light && styles.dotLight]} />
        <View style={[styles.dot, styles.dotFront, light && styles.dotLightFront]} />
      </View>
      <Text style={[styles.wordmark, compact && styles.wordmarkCompact, light && styles.lightText]}>snugg</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  symbol: {
    height: 22,
    position: "relative",
    width: 24,
  },
  symbolCompact: {
    height: 18,
    transform: [{ scale: 0.82 }],
    width: 20,
  },
  dot: {
    borderRadius: 999,
    height: 15,
    position: "absolute",
    width: 15,
  },
  dotBack: {
    backgroundColor: colors.sage,
    left: 0,
    top: 0,
  },
  dotFront: {
    backgroundColor: colors.accent,
    bottom: 0,
    right: 0,
  },
  dotLight: {
    backgroundColor: "#D7E3D8",
  },
  dotLightFront: {
    backgroundColor: "#F2B9A9",
  },
  wordmark: {
    color: colors.ink,
    fontFamily: typography.family,
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  wordmarkCompact: {
    fontSize: 18,
  },
  lightText: {
    color: colors.white,
  },
});
