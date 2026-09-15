import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  useAudioPlayerContext,
  type AudioTrack,
} from "@/src/audio/AudioPlayerProvider";
import { AudioDownloadButton } from "@/src/components/AudioDownloadButton";
import { formatDisplayDate } from "@/src/lib/format";
import { formatDuration } from "@/src/lib/audioFormat";
import type { AudioPost } from "@/src/lib/audioPosts";
import { colors } from "@/src/theme/colors";

type Props = {
  post: AudioPost;
  resumeSeconds?: number | null;
  onDownloadChange?: (slug: string, downloaded: boolean) => void;
};

export function ListenPostRow({
  post,
  resumeSeconds,
  onDownloadChange,
}: Props) {
  const { track, isPlaying, loadAndPlay, togglePlayPause } =
    useAudioPlayerContext();
  const isThis = track?.slug === post.slug;
  const date = formatDisplayDate(post.date);
  const showResume =
    resumeSeconds != null &&
    resumeSeconds > 0 &&
    (post.audioDurationSeconds == null ||
      resumeSeconds < post.audioDurationSeconds - 2);

  const onPlay = () => {
    const audioTrack: AudioTrack = {
      slug: post.slug,
      title: post.title,
      heroImage: post.heroImage,
      audioUrl: post.audio,
      durationSeconds: post.audioDurationSeconds,
    };
    if (isThis) {
      void togglePlayPause();
      return;
    }
    void loadAndPlay(audioTrack);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPlay}
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={
          isThis && isPlaying ? `Pause ${post.title}` : `Play ${post.title}`
        }
      >
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <View style={styles.meta}>
          {date ? <Text style={styles.metaText}>{date}</Text> : null}
          <Text style={styles.metaText}>
            {formatDuration(post.audioDurationSeconds)}
          </Text>
          {showResume ? (
            <Text style={styles.resume}>
              Resume {formatDuration(resumeSeconds)}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          onPress={onPlay}
          style={styles.playChip}
          accessibilityRole="button"
          accessibilityLabel={isThis && isPlaying ? "Pause" : "Play"}
        >
          <Text style={styles.playChipLabel}>
            {isThis && isPlaying ? "Pause" : "Play"}
          </Text>
        </Pressable>
        <AudioDownloadButton
          slug={post.slug}
          remoteUrl={post.audio}
          onChange={(downloaded) => onDownloadChange?.(post.slug, downloaded)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(162, 170, 173, 0.45)",
    padding: 14,
    gap: 12,
  },
  main: {
    gap: 6,
  },
  title: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 17,
    color: colors.navy,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  metaText: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 13,
    color: colors.navyMuted,
  },
  resume: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.red,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playChip: {
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  playChipLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.white,
  },
});
