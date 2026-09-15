import { Platform } from "react-native";

import { API_BASE, ApiError } from "./client";

export type PushPlatform = "ios" | "android";

export function pushPlatformFromOs(
  os: typeof Platform.OS = Platform.OS
): PushPlatform {
  return os === "android" ? "android" : "ios";
}

export async function registerPushToken(
  token: string,
  platform: PushPlatform,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const response = await fetchImpl(`${API_BASE}/api/push/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform }),
  });
  if (!response.ok) {
    throw new ApiError(
      `Failed to register push token (${response.status})`,
      response.status
    );
  }
}

export async function unregisterPushToken(
  token: string,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const response = await fetchImpl(`${API_BASE}/api/push/unregister`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    throw new ApiError(
      `Failed to unregister push token (${response.status})`,
      response.status
    );
  }
}
