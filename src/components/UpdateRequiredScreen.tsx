import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";

export function UpdateRequiredScreen() {
  return (
    <View style={styles.screen} accessibilityRole="alert">
      <Text style={styles.eyebrow}>Update required</Text>
      <Text style={styles.title}>This version of the app is no longer supported.</Text>
      <Text style={styles.body}>
        Update Pat on Sports from the App Store to keep reading. The feed API
        has moved past what this build understands.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: "center",
    padding: 28,
    gap: 12,
  },
  eyebrow: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.red,
  },
  title: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 32,
    letterSpacing: 0.4,
    color: colors.navy,
  },
  body: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    lineHeight: 26,
    color: colors.navyMuted,
  },
});
