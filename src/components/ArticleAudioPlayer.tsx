import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  useAudioPlayerContext,
  type AudioTrack,
} from "@/src/audio/AudioPlayerProvider";
import { formatDuration } from "@/src/lib/audioFormat";
import { colors } from "@/src/theme/colors";

type Props = {
  track: AudioTrack;
};

export function ArticleAudioPlayer({ track }: Props) {
  const {
    track: active,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    loadAndPlay,
    togglePlayPause,
    skipBackward,
    skipForward,
    cycleSpeed,
  } = useAudioPlayerContext();

  const isThisTrack = active?.slug === track.slug;
  const shownTime = isThisTrack ? currentTime : 0;
  const shownDuration =
    (isThisTrack && duration > 0 ? duration : track.durationSeconds) ?? 0;

  const onPlayPause = () => {
    if (!isThisTrack) {
      void loadAndPlay(track);
      return;
    }
    void togglePlayPause();
  };

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <Text style={styles.label}>Listen to this article</Text>
        <Pressable
          onPress={cycleSpeed}
          style={styles.speed}
          accessibilityRole="button"
          accessibilityLabel={`Playback speed ${playbackSpeed}x`}
        >
          <Text style={styles.speedLabel}>{playbackSpeed}x</Text>
        </Pressable>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => {
            if (!isThisTrack) {
              void loadAndPlay(track).then(() => skipBackward());
              return;
            }
            void skipBackward();
          }}
          style={styles.skip}
          accessibilityRole="button"
          accessibilityLabel="Rewind 15 seconds"
        >
          <Text style={styles.skipLabel}>−15</Text>
        </Pressable>

        <Pressable
          onPress={onPlayPause}
          style={styles.play}
          accessibilityRole="button"
          accessibilityLabel={
            isThisTrack && isPlaying ? "Pause" : "Listen to this article"
          }
        >
          <Text style={styles.playLabel}>
            {isThisTrack && isPlaying ? "Pause" : "Play"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (!isThisTrack) {
              void loadAndPlay(track).then(() => skipForward());
              return;
            }
            void skipForward();
          }}
          style={styles.skip}
          accessibilityRole="button"
          accessibilityLabel="Forward 15 seconds"
        >
          <Text style={styles.skipLabel}>+15</Text>
        </Pressable>
      </View>

      <Text style={styles.time}>
        {formatDuration(shownTime)} / {formatDuration(shownDuration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(162, 170, 173, 0.45)",
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 15,
    color: colors.navy,
  },
  speed: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(162, 170, 173, 0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  speedLabel: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 12,
    color: colors.navy,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  skip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(162, 170, 173, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  skipLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 14,
    color: colors.navy,
  },
  play: {
    minWidth: 88,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  playLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 15,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.white,
  },
  time: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 12,
    color: colors.navyMuted,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
});
