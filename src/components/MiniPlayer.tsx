import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAudioPlayerContext } from "@/src/audio/AudioPlayerProvider";
import { colors } from "@/src/theme/colors";

export function MiniPlayer() {
  const { track, isPlaying, progress, togglePlayPause } =
    useAudioPlayerContext();

  if (!track) return null;

  return (
    <View style={styles.bar} accessibilityRole="summary">
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <Link href={`/article/${track.slug}`} asChild>
          <Pressable
            style={styles.titlePress}
            accessibilityRole="link"
            accessibilityLabel={`Open article ${track.title}`}
          >
            <Text style={styles.title} numberOfLines={1}>
              {track.title}
            </Text>
          </Pressable>
        </Link>
        <Pressable
          onPress={() => {
            void togglePlayPause();
          }}
          style={styles.playButton}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
        >
          <Text style={styles.playLabel}>{isPlaying ? "Pause" : "Play"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.navy,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  progressTrack: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.red,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  titlePress: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 14,
    color: colors.white,
  },
  playButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  playLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.navy,
  },
});
