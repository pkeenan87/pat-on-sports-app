import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";

export default function ListenScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>Coming in Phase 3</Text>
      <Text style={styles.title}>Narrated recaps</Text>
      <Text style={styles.body}>
        The Listen tab will show every post with audio, download state, and a
        mini-player. Playback ships with background audio in Phase 3 — not this
        build.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: 24,
    justifyContent: "center",
    gap: 10,
  },
  eyebrow: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.red,
  },
  title: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 32,
    color: colors.navy,
    letterSpacing: 0.4,
  },
  body: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    lineHeight: 26,
    color: colors.navyMuted,
  },
});
