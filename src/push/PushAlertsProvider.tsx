import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { routeFromNotificationData } from "@/src/lib/notificationRoute";
import {
  getAlertsEnabled,
  recordArticleOpenAndShouldPrompt,
  setExplainerOutcome,
} from "@/src/lib/pushPrefs";
import {
  disablePushAlerts,
  refreshPushRegistrationIfEnabled,
  registerForPushAlerts,
} from "@/src/lib/pushRegister";

import { PushExplainerModal } from "@/src/components/PushExplainerModal";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

type PushAlertsContextValue = {
  alertsEnabled: boolean;
  recordArticleOpen: () => Promise<void>;
  enableAlerts: () => Promise<void>;
  disableAlerts: () => Promise<void>;
};

const PushAlertsContext = createContext<PushAlertsContextValue | null>(null);

function notificationData(
  notification: Notifications.Notification
): Record<string, unknown> | undefined {
  const data = notification.request.content.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return undefined;
}

export function navigateFromNotification(
  notification: Notifications.Notification
): void {
  const route = routeFromNotificationData(notificationData(notification));
  if (route.type === "article") {
    router.push(`/article/${route.slug}`);
    return;
  }
  if (route.type === "url") {
    void WebBrowser.openBrowserAsync(route.url);
  }
}

export function PushAlertsProvider({ children }: { children: ReactNode }) {
  const [alertsEnabled, setAlertsEnabledState] = useState(false);
  const [explainerVisible, setExplainerVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const enabled = await getAlertsEnabled();
      if (!cancelled) setAlertsEnabledState(enabled);
      await refreshPushRegistrationIfEnabled();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) {
      navigateFromNotification(last.notification);
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        navigateFromNotification(response.notification);
      });

    return () => {
      subscription.remove();
    };
  }, []);

  const recordArticleOpen = useCallback(async () => {
    const shouldPrompt = await recordArticleOpenAndShouldPrompt();
    if (shouldPrompt) {
      setExplainerVisible(true);
    }
  }, []);

  const enableAlerts = useCallback(async () => {
    const result = await registerForPushAlerts({ openSettingsIfDenied: true });
    if (result.ok) {
      setAlertsEnabledState(true);
    } else {
      const stillEnabled = await getAlertsEnabled();
      setAlertsEnabledState(stillEnabled);
    }
  }, []);

  const disableAlerts = useCallback(async () => {
    await disablePushAlerts();
    setAlertsEnabledState(false);
  }, []);

  const onTurnOn = useCallback(async () => {
    await setExplainerOutcome("prompted");
    setExplainerVisible(false);
    await enableAlerts();
  }, [enableAlerts]);

  const onNotNow = useCallback(async () => {
    await setExplainerOutcome("dismissed");
    setExplainerVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      alertsEnabled,
      recordArticleOpen,
      enableAlerts,
      disableAlerts,
    }),
    [alertsEnabled, recordArticleOpen, enableAlerts, disableAlerts]
  );

  return (
    <PushAlertsContext.Provider value={value}>
      {children}
      <PushExplainerModal
        visible={explainerVisible}
        onTurnOn={() => {
          void onTurnOn();
        }}
        onNotNow={() => {
          void onNotNow();
        }}
      />
    </PushAlertsContext.Provider>
  );
}

export function usePushAlerts(): PushAlertsContextValue {
  const ctx = useContext(PushAlertsContext);
  if (!ctx) {
    throw new Error("usePushAlerts must be used within PushAlertsProvider");
  }
  return ctx;
}
