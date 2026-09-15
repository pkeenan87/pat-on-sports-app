import { NetworkStateType, useNetworkState } from "expo-network";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  deleteDownloadedAudio,
  downloadAudio,
  fetchContentLength,
  INITIAL_DOWNLOAD_STATE,
  isAudioDownloaded,
  reduceDownloadState,
} from "@/src/lib/audioDownload";
import { formatFileSize } from "@/src/lib/audioFormat";
import { isDeviceOnline } from "@/src/lib/prefetch";
import { colors } from "@/src/theme/colors";

type Props = {
  slug: string;
  remoteUrl: string;
  onChange?: (downloaded: boolean) => void;
};

export function AudioDownloadButton({ slug, remoteUrl, onChange }: Props) {
  const network = useNetworkState();
  const [state, dispatch] = useReducer(
    reduceDownloadState,
    INITIAL_DOWNLOAD_STATE
  );
  const [hydrated, setHydrated] = useState(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    void isAudioDownloaded(slug).then((downloaded) => {
      if (cancelled) return;
      if (downloaded) {
        dispatch({ type: "done" });
        onChangeRef.current?.(true);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const startDownload = useCallback(async () => {
    dispatch({ type: "start" });
    try {
      await downloadAudio({
        slug,
        remoteUrl,
        onProgress: (progress) => {
          dispatch({ type: "progress", progress });
        },
      });
      dispatch({ type: "done" });
      onChangeRef.current?.(true);
    } catch (error) {
      dispatch({
        type: "error",
        message: error instanceof Error ? error.message : "Download failed",
      });
      onChangeRef.current?.(false);
    }
  }, [remoteUrl, slug]);

  const confirmAndDownload = useCallback(async () => {
    const online = isDeviceOnline(network);
    if (!online) {
      Alert.alert("You’re offline", "Connect to download this recording.");
      return;
    }

    const isCellular = network.type === NetworkStateType.CELLULAR;
    if (isCellular) {
      const bytes = await fetchContentLength(remoteUrl);
      const sizeLabel = formatFileSize(bytes);
      Alert.alert(
        "Download on cellular?",
        `This recording is ${sizeLabel}. Download using cellular data?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Download",
            onPress: () => {
              void startDownload();
            },
          },
        ]
      );
      return;
    }

    await startDownload();
  }, [network, remoteUrl, startDownload]);

  const onDelete = useCallback(() => {
    Alert.alert("Delete download?", "Remove the offline copy of this recording.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await deleteDownloadedAudio(slug);
            dispatch({ type: "delete" });
            onChangeRef.current?.(false);
          })();
        },
      },
    ]);
  }, [slug]);

  if (!hydrated) {
    return <View style={styles.placeholder} />;
  }

  if (state.status === "done") {
    return (
      <Pressable
        onPress={onDelete}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Delete download"
      >
        <Text style={styles.buttonLabel}>Delete</Text>
      </Pressable>
    );
  }

  if (state.status === "downloading") {
    const pct =
      state.progress == null ? "…" : `${Math.round(state.progress * 100)}%`;
    return (
      <View style={styles.buttonMuted}>
        <Text style={styles.buttonLabelMuted}>{pct}</Text>
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <Pressable
        onPress={() => {
          void confirmAndDownload();
        }}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Retry download"
      >
        <Text style={styles.buttonLabel}>Retry</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => {
        void confirmAndDownload();
      }}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Download audio"
    >
      <Text style={styles.buttonLabel}>Download</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: 72,
    height: 32,
  },
  button: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(162, 170, 173, 0.55)",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonMuted: {
    borderRadius: 999,
    backgroundColor: "rgba(12, 35, 64, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: "center",
  },
  buttonLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.navy,
  },
  buttonLabelMuted: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.navyMuted,
  },
});
