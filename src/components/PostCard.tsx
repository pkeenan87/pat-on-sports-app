import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CategoryChip } from "@/src/components/CategoryChip";
import { ScorelineBadge } from "@/src/components/ScorelineBadge";
import type { ApiPostSummary } from "@/src/lib/api";
import { formatDisplayDate } from "@/src/lib/format";
import { colors } from "@/src/theme/colors";

type Props = {
  post: ApiPostSummary;
  featured?: boolean;
};

export function PostCard({ post, featured = false }: Props) {
  const date = formatDisplayDate(post.date);

  return (
    <Link href={`/article/${post.slug}`} asChild>
      <Pressable
        style={StyleSheet.flatten([styles.card, featured && styles.featured])}
        accessibilityRole="button"
        accessibilityLabel={post.title}
      >
        {post.heroImage ? (
          <Image
            source={{ uri: post.heroImage }}
            style={[styles.image, featured && styles.featuredImage]}
            contentFit="cover"
            accessibilityLabel={post.heroAlt ?? post.title}
          />
        ) : null}
        <View style={styles.body}>
          <View style={styles.meta}>
            <CategoryChip category={post.category} />
            {post.result != null &&
            post.scoreUs != null &&
            post.scoreThem != null ? (
              <ScorelineBadge
                result={post.result}
                scoreUs={post.scoreUs}
                scoreThem={post.scoreThem}
              />
            ) : null}
          </View>
          <Text style={[styles.title, featured && styles.featuredTitle]}>
            {post.title}
          </Text>
          {post.description ? (
            <Text style={styles.description} numberOfLines={featured ? 3 : 2}>
              {post.description}
            </Text>
          ) : null}
          <Text style={styles.footer}>
            {[date, `${post.readingTimeMinutes} min read`]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(162, 170, 173, 0.45)",
    overflow: "hidden",
  },
  featured: {
    borderRadius: 14,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.navyMuted,
  },
  featuredImage: {
    aspectRatio: 16 / 9,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 22,
    letterSpacing: 0.4,
    color: colors.navy,
  },
  featuredTitle: {
    fontSize: 28,
  },
  description: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.navyMuted,
  },
  footer: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 13,
    color: colors.navyMuted,
  },
});
