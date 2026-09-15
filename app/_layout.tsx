import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from "@expo-google-fonts/barlow-condensed";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from "@expo-google-fonts/ibm-plex-sans";
import { useIsRestoring } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { AudioPlayerProvider } from "@/src/audio/AudioPlayerProvider";
import { UpdateRequiredScreen } from "@/src/components/UpdateRequiredScreen";
import { useManifest } from "@/src/hooks/usePosts";
import { shouldShowUpdateRequired } from "@/src/lib/manifest";
import { createAppQueryClient, persistOptions } from "@/src/lib/queryClient";
import { colors } from "@/src/theme/colors";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.paper,
      }}
    >
      <ActivityIndicator color={colors.navy} />
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => createAppQueryClient());

  const [loaded, error] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const ready = loaded || Boolean(error);

  useEffect(() => {
    if (error) {
      console.warn("Brand fonts failed to load; using system fonts.", error);
    }
  }, [error]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
      >
        <AudioPlayerProvider>
          <AppShell />
        </AudioPlayerProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const isRestoring = useIsRestoring();
  const manifest = useManifest();

  if (isRestoring) {
    return <LoadingScreen />;
  }

  if (manifest.isLoading && !manifest.data) {
    return <LoadingScreen />;
  }

  if (manifest.data && shouldShowUpdateRequired(manifest.data)) {
    return <UpdateRequiredScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.navy,
        headerStyle: { backgroundColor: colors.paper },
        headerTitleStyle: {
          fontFamily: "BarlowCondensed_700Bold",
          fontSize: 20,
        },
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="article/[slug]"
        options={{ title: "Article", headerBackTitle: "Back" }}
      />
    </Stack>
  );
}
