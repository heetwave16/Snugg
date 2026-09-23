import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomTabBar } from "@/components/BottomTabBar";
import { colors, spacing } from "@/theme";

export function AppScreen({
  children,
  scroll = true,
  tabBar = false,
  tabSpaceId,
  contentContainerStyle,
  ...scrollProps
}: ScrollViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
  tabBar?: boolean;
  tabSpaceId?: string;
  contentContainerStyle?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = tabBar ? 104 + insets.bottom : spacing.xl;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {scroll ? (
        <ScrollView
          {...scrollProps}
          contentContainerStyle={[{ paddingBottom: bottomPadding }, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
      {tabBar ? <BottomTabBar spaceId={tabSpaceId} /> : null}
    </View>
  );
}

export function PageBody({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.body, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
});
