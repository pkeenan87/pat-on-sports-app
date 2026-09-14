import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  visible: boolean;
};

export function OfflineIndicator({ visible }: Props) {
  if (!visible) return null;
  return (
    <View
      style={styles.bar}
      accessibilityRole="text"
      accessibilityLabel="Offline. Showing cached content."
    >
      <Text style={styles.text}>Offline · showing cached content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.navy,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.white,
    textAlign: "center",
  },
});
