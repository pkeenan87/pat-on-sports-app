import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CategoryFilter } from "@/src/components/CategoryFilter";
import { PostCard } from "@/src/components/PostCard";
import { usePostsFeed } from "@/src/hooks/usePosts";
import {
  filterPostsByCategory,
  is2025RunPost,
  type CategoryLabel,
} from "@/src/lib/format";
import { colors } from "@/src/theme/colors";

export default function LatestScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    usePostsFeed();
  const [category, setCategory] = useState<CategoryLabel | "All">("All");

  const { featured, rest, from2025 } = useMemo(() => {
    const posts = filterPostsByCategory(data?.posts ?? [], category);
    const latestPool = posts.filter((post) => !is2025RunPost(post));
    const run2025Pool = posts.filter(is2025RunPost);
    const lead = latestPool[0] ?? posts[0];
    const heroSlug = lead?.slug;
    return {
      featured: lead,
      rest: latestPool.filter((post) => post.slug !== heroSlug),
      from2025: run2025Pool.filter((post) => post.slug !== heroSlug),
    };
  }, [data?.posts, category]);

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn’t load posts</Text>
        <Text style={styles.errorBody}>
          {error instanceof Error ? error.message : "Unknown error"}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
          tintColor={colors.navy}
        />
      }
    >
      <Text style={styles.brand}>Pat on Sports</Text>
      <Text style={styles.lede}>Weekly recaps, without the noise.</Text>

      <CategoryFilter selected={category} onSelect={setCategory} />

      {featured ? (
        <View style={styles.section}>
          <PostCard post={featured} featured />
        </View>
      ) : (
        <Text style={styles.empty}>No posts in this category yet.</Text>
      )}

      {rest.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest</Text>
          <View style={styles.stack}>
            {rest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </View>
        </View>
      ) : null}

      {from2025.length > 0 && category === "All" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From the 2025 run</Text>
          <View style={styles.stack}>
            {from2025.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  brand: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 34,
    letterSpacing: 0.6,
    color: colors.navy,
  },
  lede: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    color: colors.navyMuted,
    marginTop: -8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 22,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.navy,
  },
  stack: {
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
    padding: 24,
    gap: 8,
  },
  errorTitle: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 22,
    color: colors.navy,
  },
  errorBody: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 14,
    color: colors.navyMuted,
    textAlign: "center",
  },
  empty: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 15,
    color: colors.navyMuted,
  },
});
