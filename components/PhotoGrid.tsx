import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useState } from "react";

import type { MediaItem } from "@/types";
import { colors, spacing, typography } from "@/theme";

const COLUMNS = 3;
const GRID_GAP = 3;

export function PhotoGrid({ media, onPress }: { media: MediaItem[]; onPress: (item: MediaItem) => void }) {
  const { width } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  // The fallback keeps the first frame square before onLayout reports the real
  // container width. Using the container width makes the component reusable
  // outside of PageBody and keeps the grid correct on tablets and rotation.
  const availableWidth = gridWidth ?? Math.max(width - spacing.lg * 2, 0);
  const tileWidth = Math.floor((availableWidth - GRID_GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <View onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)} style={[styles.grid, { gap: GRID_GAP }]}>
      {media.map((item) => (
        <Pressable
          accessibilityLabel={`Open ${item.kind}`}
          accessibilityRole="button"
          key={item.id}
          onPress={() => onPress(item)}
          style={({ pressed }) => [styles.tile, { height: tileWidth, width: tileWidth }, pressed && styles.pressed]}
        >
          <Image resizeMode="cover" source={item.source} style={styles.image} />
          {item.kind === "video" ? (
            <View style={styles.videoBadge}>
              <Ionicons color={colors.white} name="play" size={11} />
              <Text style={styles.duration}>{item.duration}</Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
  },
  tile: {
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  videoBadge: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    borderRadius: 9,
    bottom: 6,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    position: "absolute",
    right: 6,
  },
  duration: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
});
