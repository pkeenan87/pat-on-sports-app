import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";

import { CACHE_MAX_AGE_MS } from "./articleCache";

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: CACHE_MAX_AGE_MS,
        retry: 1,
      },
    },
  });
}

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "pat-on-sports-query-cache",
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: CACHE_MAX_AGE_MS,
};
