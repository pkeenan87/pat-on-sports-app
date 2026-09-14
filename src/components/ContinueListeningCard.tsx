import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text } from "react-native";

import {
  useAudioPlayerContext,
  type AudioTrack,
} from "@/src/audio/AudioPlayerProvider";
import { formatRemaining } from "@/src/lib/audioFormat";
import {
  getLastPlayedSlug,
  getPosition,
  hasResumePosition,
} from "@/src/lib/audioPosition";
import type { ApiPostSummary } from "@/src/lib/api";
import { colors } from "@/src/theme/colors";

type Props = {
  posts: ApiPostSummary[];
};

export function ContinueListeningCard({ posts }: Props) {
  const { track, isPlaying, loadAndPlay } = useAudioPlayerContext();

  const resumeQuery = useQuery({
    queryKey: [
      "audio",
      "continue",
      posts.map((p) => p.slug).join(","),
      track?.slug,
      isPlaying,
    ],
    queryFn: async () => {
      const slug = await getLastPlayedSlug();
      if (!slug) return null;
      const post = posts.find((p) => p.slug === slug && p.audio);
      if (!post?.audio) return null;
      const position = await getPosition(slug);
      if (!hasResumePosition(position, post.audioDurationSeconds)) return null;
      return { post, position: position! };
    },
  });

  const resume = resumeQuery.data;
  if (!resume) return null;
  if (track?.slug === resume.post.slug && isPlaying) return null;

  const remaining = Math.max(
    0,
    (resume.post.audioDurationSeconds ?? 0) - resume.position
  );

  const onPress = () => {
    const audioTrack: AudioTrack = {
      slug: resume.post.slug,
      title: resume.post.title,
      heroImage: resume.post.heroImage,
      audioUrl: resume.post.audio!,
      durationSeconds: resume.post.audioDurationSeconds,
    };
    void loadAndPlay(audioTrack);
  };

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Continue listening to ${resume.post.title}`}
    >
      <Text style={styles.eyebrow}>Continue listening</Text>
      <Text style={styles.title} numberOfLines={2}>
        {resume.post.title}
      </Text>
      <Text style={styles.meta}>{formatRemaining(remaining)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  eyebrow: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.red,
  },
  title: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 16,
    color: colors.white,
  },
  meta: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
});
