import * as Notifications from "expo-notifications";
import { router, useRootNavigationState } from "expo-router";
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

import { PushExplainerModal } from "@/src/components/PushExplainerModal";
import {
  routeFromNotificationData,
  type NotificationRoute,
} from "@/src/lib/notificationRoute";
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

function routeFromNotification(
  notification: Notifications.Notification
): NotificationRoute {
  return routeFromNotificationData(notificationData(notification));
}

function performNotificationRoute(route: NotificationRoute): void {
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
  const [pendingRoute, setPendingRoute] = useState<NotificationRoute | null>(
    null
  );
  const rootState = useRootNavigationState();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const enabled = await getAlertsEnabled();
      if (!cancelled) setAlertsEnabledState(enabled);
      await refreshPushRegistrationIfEnabled();
      if (!cancelled) {
        setAlertsEnabledState(await getAlertsEnabled());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const queue = (notification: Notifications.Notification) => {
      const route = routeFromNotification(notification);
      if (route.type !== "none") {
        setPendingRoute(route);
      }
    };

    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) {
      queue(last.notification);
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        queue(response.notification);
      });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!rootState?.key || !pendingRoute) return;
    const route = pendingRoute;
    performNotificationRoute(route);
    const clear = setTimeout(() => {
      setPendingRoute((current) => (current === route ? null : current));
    }, 0);
    return () => {
      clearTimeout(clear);
    };
  }, [rootState?.key, pendingRoute]);

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
