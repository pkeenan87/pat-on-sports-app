import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

import {
  clearStoredPushToken,
  getAlertsEnabled,
  getStoredPushToken,
  setAlertsEnabled,
  setStoredPushToken,
} from "./pushPrefs";
import {
  pushPlatformFromOs,
  registerPushToken,
  unregisterPushToken,
} from "./pushClient";

export type RegisterResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

function easProjectId(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromExtra === "string" && fromExtra.length > 0) return fromExtra;
  const fromEas = Constants.easConfig?.projectId;
  if (typeof fromEas === "string" && fromEas.length > 0) return fromEas;
  return null;
}

export async function registerForPushAlerts(options?: {
  /** When true and permission was previously denied, open system Settings. */
  openSettingsIfDenied?: boolean;
  fetchImpl?: typeof fetch;
}): Promise<RegisterResult> {
  const fetchImpl = options?.fetchImpl ?? fetch;

  if (!Device.isDevice) {
    const reason = "Skipping push registration: not a physical device (simulator)";
    console.log(reason);
    return { ok: false, reason };
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    if (
      options?.openSettingsIfDenied &&
      existing.canAskAgain === false &&
      status === "denied"
    ) {
      await Linking.openSettings();
      return { ok: false, reason: "Permission denied; opened system Settings" };
    }

    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    return { ok: false, reason: `Permission not granted (${status})` };
  }

  const projectId = easProjectId();
  if (!projectId) {
    return { ok: false, reason: "Missing EAS projectId in app config" };
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const token = tokenResponse.data;
  const platform = pushPlatformFromOs(Platform.OS);

  await registerPushToken(token, platform, fetchImpl);
  await setStoredPushToken(token);
  await setAlertsEnabled(true);

  return { ok: true, token };
}

/** Re-POST the current token on launch so the server's last_seen stays fresh. */
export async function refreshPushRegistrationIfEnabled(options?: {
  fetchImpl?: typeof fetch;
}): Promise<RegisterResult | { ok: false; reason: string }> {
  const enabled = await getAlertsEnabled();
  if (!enabled) {
    return { ok: false, reason: "Alerts not enabled" };
  }
  return registerForPushAlerts({
    openSettingsIfDenied: false,
    fetchImpl: options?.fetchImpl,
  });
}

export async function disablePushAlerts(options?: {
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const token = await getStoredPushToken();

  if (token && Device.isDevice) {
    try {
      await unregisterPushToken(token, fetchImpl);
    } catch (error) {
      console.warn("Failed to unregister push token", error);
    }
  } else if (!Device.isDevice) {
    console.log("Skipping push unregister network call: simulator");
  }

  await setAlertsEnabled(false);
  await clearStoredPushToken();
}
