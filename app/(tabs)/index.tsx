import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CategoryFilter } from "@/src/components/CategoryFilter";
import { ErrorState } from "@/src/components/ErrorState";
import { ManifestBanner } from "@/src/components/ManifestBanner";
import { OfflineIndicator } from "@/src/components/OfflineIndicator";
import { PostCard } from "@/src/components/PostCard";
import { useManifest, usePostsFeed } from "@/src/hooks/usePosts";
import {
  filterPostsByCategory,
  is2025RunPost,
  type CategoryLabel,
} from "@/src/lib/format";
import { shouldShowManifestBanner } from "@/src/lib/manifest";
import { shouldShowOfflineEmptyState } from "@/src/lib/queryState";
import { colors } from "@/src/theme/colors";

function bannerStorageKey(message: string): string {
  // Simple stable key from the message text (not a crypto hash).
  let hash = 0;
  for (let i = 0; i < message.length; i += 1) {
    hash = (hash * 31 + message.charCodeAt(i)) | 0;
  }
  return `manifest-banner-dismissed:${hash}`;
}

export default function LatestScreen() {
  const feed = usePostsFeed();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isServingFromCache,
    isPending,
    fetchStatus,
  } = feed;
  const manifest = useManifest();
  const [category, setCategory] = useState<CategoryLabel | "All">("All");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const bannerMessage = manifest.data?.message?.trim() || null;
  const bannerKey = useMemo(
    () => (bannerMessage ? bannerStorageKey(bannerMessage) : null),
    [bannerMessage]
  );

  useEffect(() => {
    if (!bannerKey) return;
    let cancelled = false;
    void AsyncStorage.getItem(bannerKey).then((value) => {
      if (!cancelled && value === "1") {
        setBannerDismissed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bannerKey]);

  const showBanner =
    Boolean(manifest.data) &&
    shouldShowManifestBanner(manifest.data!) &&
    !bannerDismissed;

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

  if (shouldShowOfflineEmptyState({ data, isPending, fetchStatus })) {
    return (
      <ErrorState
        title="You’re offline"
        message="Connect once to download the feed, then you can read cached articles offline."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (isError && !data) {
    return (
      <ErrorState
        title="Couldn’t load posts"
        message={error instanceof Error ? error.message : "Unknown error"}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <OfflineIndicator visible={Boolean(isServingFromCache)} />
      <ScrollView
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

        {showBanner && bannerMessage ? (
          <ManifestBanner
            message={bannerMessage}
            onDismiss={() => {
              setBannerDismissed(true);
              if (bannerKey) {
                void AsyncStorage.setItem(bannerKey, "1");
              }
            }}
          />
        ) : null}

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
    </View>
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
  empty: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 15,
    color: colors.navyMuted,
  },
});
