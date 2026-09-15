import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";

import {
  setAlertsEnabled,
  setStoredPushToken,
} from "../lib/pushPrefs";
import {
  disablePushAlerts,
  registerForPushAlerts,
} from "../lib/pushRegister";

type DeviceMock = {
  isDevice: boolean;
  __setIsDevice: (value: boolean) => void;
  __resetIsDevice: () => void;
};
type NotificationsMock = {
  __pushTestReset: () => void;
  __pushTestSetDevicePermission: (opts: {
    status: "undetermined" | "granted" | "denied";
    canAskAgain?: boolean;
  }) => void;
  getExpoPushTokenAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
};

function deviceMock(): DeviceMock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- test helper
  return require("expo-device") as DeviceMock;
}

function notificationsMock(): NotificationsMock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- test helper
  return require("expo-notifications") as NotificationsMock;
}

describe("push registration client", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    notificationsMock().__pushTestReset();
    deviceMock().__resetIsDevice();
    jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("POSTs the Expo token to /api/push/register with platform", async () => {
    notificationsMock().__pushTestSetDevicePermission({ status: "undetermined" });
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const result = await registerForPushAlerts({ fetchImpl });

    expect(result).toEqual({
      ok: true,
      token: "ExponentPushToken[test-token]",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://patonsports.com/api/push/register",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "ExponentPushToken[test-token]",
          platform: "ios",
        }),
      })
    );
    expect(notificationsMock().requestPermissionsAsync).toHaveBeenCalled();
    expect(notificationsMock().getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "ae5408fc-cf1a-471f-9134-bd65dcef4efd",
    });
  });

  it("unregisters on opt-out", async () => {
    await setStoredPushToken("ExponentPushToken[test-token]");
    await setAlertsEnabled(true);
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await disablePushAlerts({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://patonsports.com/api/push/unregister",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "ExponentPushToken[test-token]" }),
      })
    );
  });

  it("makes no network call on a simulator", async () => {
    deviceMock().__setIsDevice(false);
    const fetchImpl = jest.fn();
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await registerForPushAlerts({ fetchImpl });

    expect(result.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("simulator")
    );

    await setStoredPushToken("ExponentPushToken[test-token]");
    await setAlertsEnabled(true);
    await disablePushAlerts({ fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
