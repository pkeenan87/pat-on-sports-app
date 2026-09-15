import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ArticleAudioPlayer } from "@/src/components/ArticleAudioPlayer";
import { ArticleMarkdown } from "@/src/components/ArticleMarkdown";
import { CategoryChip } from "@/src/components/CategoryChip";
import { ErrorState } from "@/src/components/ErrorState";
import { ProsConsCards } from "@/src/components/ProsConsCards";
import { ScorelineBadge } from "@/src/components/ScorelineBadge";
import { usePostDetail, usePostsFeed } from "@/src/hooks/usePosts";
import { canonicalPostUrl } from "@/src/lib/client";
import { isOfflineUnavailableError } from "@/src/lib/articleCache";
import { formatDisplayDate, getOpponentTags } from "@/src/lib/format";
import { usePushAlerts } from "@/src/push/PushAlertsProvider";
import { colors } from "@/src/theme/colors";

export default function ArticleScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const feed = usePostsFeed();
  const expectedBodyHash =
    feed.data?.posts.find((post) => post.slug === slug)?.bodyHash ?? null;
  const { data, isLoading, isError, error, failureReason, refetch } =
    usePostDetail(slug ?? "", expectedBodyHash);
  const { recordArticleOpen } = usePushAlerts();
  const countedSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data?.slug) return;
    if (countedSlugRef.current === data.slug) return;
    countedSlugRef.current = data.slug;
    void recordArticleOpen();
  }, [data?.slug, recordArticleOpen]);

  const relatedPosts = useMemo(() => {
    if (!data || !feed.data) return [];
    return data.related
      .map((relatedSlug) =>
        feed.data.posts.find((post) => post.slug === relatedSlug)
      )
      .filter((post): post is NonNullable<typeof post> => Boolean(post));
  }, [data, feed.data]);

  const share = async () => {
    if (!data) return;
    const url = canonicalPostUrl(data.slug);
    await Share.share({
      message: `${data.title}\n${url}`,
      url,
      title: data.title,
    });
  };

  if (!slug) {
    return <ErrorState title="Missing article" />;
  }

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (isError || !data) {
    const offlineError = [error, failureReason].find(isOfflineUnavailableError);
    const offline = Boolean(offlineError);
    let message = "Unknown error";
    if (offline) {
      message =
        "Connect to the internet once to cache this article, then try again.";
    } else if (error && typeof error === "object" && "message" in error) {
      message = String((error as { message: unknown }).message);
    } else if (
      failureReason &&
      typeof failureReason === "object" &&
      "message" in failureReason
    ) {
      message = String((failureReason as { message: unknown }).message);
    }
    return (
      <ErrorState
        title={offline ? "Not available offline" : "Couldn’t load article"}
        message={message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const date = formatDisplayDate(data.date);
  const opponents = getOpponentTags(data.tags);
  const useProsCons = Boolean(data.prosCons?.hasPanels);

  return (
    <>
      <Stack.Screen
        options={{
          title: data.category.label,
          headerRight: () => (
            <Pressable onPress={() => void share()} hitSlop={12}>
              <Text style={styles.share}>Share</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.meta}>
          <CategoryChip category={data.category} />
          {data.result != null &&
          data.scoreUs != null &&
          data.scoreThem != null ? (
            <ScorelineBadge
              result={data.result}
              scoreUs={data.scoreUs}
              scoreThem={data.scoreThem}
            />
          ) : null}
          {date ? <Text style={styles.metaText}>{date}</Text> : null}
          <Text style={styles.metaText}>{data.readingTimeMinutes} min read</Text>
        </View>

        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.byline}>
          By Pat
          {data.round
            ? ` · ${data.round}`
            : data.week
              ? ` · Week ${data.week}${data.season ? ` · ${data.season}` : ""}`
              : ""}
        </Text>

        {data.audio ? (
          <ArticleAudioPlayer
            track={{
              slug: data.slug,
              title: data.title,
              heroImage: data.heroImage,
              audioUrl: data.audio,
              durationSeconds: data.audioDurationSeconds,
            }}
          />
        ) : null}

        {opponents.length > 0 ? (
          <View style={styles.tags}>
            {opponents.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        ) : null}

        {data.heroImage ? (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: data.heroImage }}
              style={styles.hero}
              contentFit="cover"
              accessibilityLabel={data.heroAlt ?? data.title}
            />
            {data.heroCaption ? (
              <Text style={styles.caption}>{data.heroCaption}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.divider} />

        {useProsCons && data.prosCons ? (
          <ProsConsCards prosCons={data.prosCons} />
        ) : (
          <ArticleMarkdown markdown={data.markdown} />
        )}

        {relatedPosts.length > 0 ? (
          <View style={styles.related}>
            <Text style={styles.relatedTitle}>Related</Text>
            {relatedPosts.map((post) => (
              <Link key={post.slug} href={`/article/${post.slug}`} asChild>
                <Pressable style={styles.relatedRow}>
                  <Text style={styles.relatedLabel}>{post.category.label}</Text>
                  <Text style={styles.relatedPostTitle}>{post.title}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 13,
    color: colors.navyMuted,
  },
  title: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 34,
    letterSpacing: 0.4,
    color: colors.navy,
  },
  byline: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 14,
    color: colors.navyMuted,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(162, 170, 173, 0.5)",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 12,
    color: colors.navy,
  },
  heroWrap: {
    gap: 6,
  },
  hero: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: colors.navyMuted,
  },
  caption: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 12,
    color: colors.navyMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(162, 170, 173, 0.55)",
    marginVertical: 4,
  },
  related: {
    marginTop: 20,
    gap: 10,
  },
  relatedTitle: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 22,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.navy,
  },
  relatedRow: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(162, 170, 173, 0.45)",
    padding: 12,
    gap: 4,
  },
  relatedLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.red,
  },
  relatedPostTitle: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 15,
    color: colors.navy,
  },
  share: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 15,
    color: colors.navy,
    marginRight: 4,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
    padding: 24,
    gap: 8,
  },
});
