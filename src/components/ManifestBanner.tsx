import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  message: string;
  onDismiss: () => void;
};

export function ManifestBanner({ message, onDismiss }: Props) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onDismiss}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Dismiss banner"
      >
        <Text style={styles.dismiss}>Dismiss</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.red,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  message: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
  dismiss: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.white,
    alignSelf: "flex-end",
  },
});
