import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ErrorState } from "@/src/components/ErrorState";
import { ListenPostRow } from "@/src/components/ListenPostRow";
import { OfflineIndicator } from "@/src/components/OfflineIndicator";
import { usePostsFeed } from "@/src/hooks/usePosts";
import { listDownloadedSlugs } from "@/src/lib/audioDownload";
import { filterAudioPosts } from "@/src/lib/audioPosts";
import { getAllPositions } from "@/src/lib/audioPosition";
import { shouldShowOfflineEmptyState } from "@/src/lib/queryState";
import { colors } from "@/src/theme/colors";

type Filter = "all" | "downloaded";

export default function ListenScreen() {
  const queryClient = useQueryClient();
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
  const [filter, setFilter] = useState<Filter>("all");

  const downloads = useQuery({
    queryKey: ["audio", "downloads"],
    queryFn: listDownloadedSlugs,
  });
  const positions = useQuery({
    queryKey: ["audio", "positions"],
    queryFn: getAllPositions,
  });

  const downloadedSlugs = useMemo(
    () => new Set(downloads.data ?? []),
    [downloads.data]
  );

  const posts = useMemo(
    () =>
      filterAudioPosts(data?.posts ?? [], {
        downloadedOnly: filter === "downloaded",
        downloadedSlugs,
      }),
    [data?.posts, downloadedSlugs, filter]
  );

  if (shouldShowOfflineEmptyState({ data, isPending, fetchStatus })) {
    return (
      <ErrorState
        title="You’re offline"
        message="Connect once to load the feed, then downloaded recordings play offline."
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
        title="Couldn’t load Listen"
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
      <View style={styles.filters}>
        <Pressable
          onPress={() => setFilter("all")}
          style={[styles.chip, filter === "all" && styles.chipActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === "all" }}
        >
          <Text
            style={[styles.chipLabel, filter === "all" && styles.chipLabelActive]}
          >
            All
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter("downloaded")}
          style={[styles.chip, filter === "downloaded" && styles.chipActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === "downloaded" }}
        >
          <Text
            style={[
              styles.chipLabel,
              filter === "downloaded" && styles.chipLabelActive,
            ]}
          >
            Downloaded
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <ListenPostRow
            post={item}
            resumeSeconds={positions.data?.[item.slug] ?? null}
            onDownloadChange={() => {
              void queryClient.invalidateQueries({
                queryKey: ["audio", "downloads"],
              });
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {filter === "downloaded"
                ? "No downloads yet"
                : "No narrated posts yet"}
            </Text>
            <Text style={styles.emptyBody}>
              {filter === "downloaded"
                ? "Download a recording from this tab to listen offline."
                : "When a post has audio, it shows up here — newest first."}
            </Text>
          </View>
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
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(162, 170, 173, 0.55)",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.navy,
  },
  chipLabelActive: {
    color: colors.white,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  empty: {
    paddingTop: 48,
    paddingHorizontal: 12,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 22,
    color: colors.navy,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.navyMuted,
    textAlign: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
});
