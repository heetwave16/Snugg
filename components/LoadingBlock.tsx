import { StyleSheet, View } from "react-native";

import { colors, radii } from "@/theme";

export function LoadingBlock({ height = 96, width = "100%" }: { height?: number; width?: number | `${number}%` }) {
  return <View style={[styles.block, { height, width }]} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    opacity: 0.72,
  },
});
