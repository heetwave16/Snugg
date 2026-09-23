import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";

import { colors, typography } from "@/theme";

export function Avatar({ source, initials, size = 44 }: { source?: ImageSourcePropType; initials: string; size?: number }) {
  return source ? (
    <Image source={source} style={[styles.image, { borderRadius: size / 2, height: size, width: size }]} />
  ) : (
    <View style={[styles.fallback, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceMuted,
  },
  fallback: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    justifyContent: "center",
  },
  initials: {
    color: colors.accentDark,
    fontFamily: typography.family,
    fontWeight: "700",
  },
});
