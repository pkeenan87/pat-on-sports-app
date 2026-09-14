import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ErrorState } from "@/src/components/ErrorState";
import { OfflineIndicator } from "@/src/components/OfflineIndicator";
import { PostCard } from "@/src/components/PostCard";
import { useCachedBodies, usePostsFeed } from "@/src/hooks/usePosts";
import {
  filterPostsByQuery,
  groupPostsBySeason,
  is2025RunPost,
} from "@/src/lib/format";
import type { ApiPostSummary } from "@/src/lib/api";
import { shouldShowOfflineEmptyState } from "@/src/lib/queryState";
import { colors } from "@/src/theme/colors";

type Row =
  | { type: "header"; key: string; title: string }
  | { type: "post"; key: string; post: ApiPostSummary };

export default function ArchiveScreen() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isServingFromCache,
    isPending,
    fetchStatus,
  } = usePostsFeed();
  const cachedBodies = useCachedBodies();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const filtered = filterPostsByQuery(
      data?.posts ?? [],
      query,
      cachedBodies.data ?? {}
    );
    const runShelf = !query.trim()
      ? filtered.filter(is2025RunPost).slice(0, 8)
      : [];
    const bySeason = groupPostsBySeason(filtered);
    const next: Row[] = [];

    if (runShelf.length > 0) {
      next.push({
        type: "header",
        key: "shelf-2025",
        title: "From the 2025 run",
      });
      for (const post of runShelf) {
        next.push({ type: "post", key: `shelf-${post.slug}`, post });
      }
    }

    for (const group of bySeason) {
      next.push({
        type: "header",
        key: `season-${group.season ?? "none"}`,
        title: group.season ? String(group.season) : "Other",
      });
      for (const post of group.posts) {
        next.push({ type: "post", key: post.slug, post });
      }
    }

    return next;
  }, [data?.posts, query, cachedBodies.data]);

  if (shouldShowOfflineEmptyState({ data, isPending, fetchStatus })) {
    return (
      <ErrorState
        title="You’re offline"
        message="Connect once to download the archive, then you can search cached articles offline."
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
        title="Couldn’t load archive"
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
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search title, description, tags, body…"
          placeholderTextColor="rgba(27, 54, 84, 0.45)"
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel="Search archive"
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return <Text style={styles.sectionTitle}>{item.title}</Text>;
          }
          return <PostCard post={item.post} />;
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No posts match that search.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  search: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(162, 170, 173, 0.55)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    color: colors.navy,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 22,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.navy,
    marginTop: 8,
    marginBottom: 4,
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
    textAlign: "center",
    marginTop: 24,
  },
});
