import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { BrandMark } from "@/components/BrandMark";
import { colors, typography } from "@/theme";

export default function LaunchScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { duration: 720, toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { damping: 18, stiffness: 120, toValue: 0, useNativeDriver: true }),
      Animated.spring(scale, { damping: 16, stiffness: 130, toValue: 1, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => router.replace("/spaces"), 1250);
    return () => clearTimeout(timer);
  }, [opacity, router, scale, translateY]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.mark, { opacity, transform: [{ translateY }, { scale }] }]}>
        <BrandMark />
        <Text style={styles.tagline}>memories, kept close</Text>
      </Animated.View>
      <Text style={styles.footer}>A private space for your people</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: "center",
  },
  mark: {
    alignItems: "center",
  },
  tagline: {
    color: colors.inkSoft,
    fontFamily: typography.family,
    fontSize: 12,
    letterSpacing: 0.2,
    marginTop: 14,
  },
  footer: {
    bottom: 34,
    color: colors.inkFaint,
    fontFamily: typography.family,
    fontSize: 11,
    position: "absolute",
  },
});
