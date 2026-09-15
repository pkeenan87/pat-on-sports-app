import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { PushAlertsProvider } from "../push/PushAlertsProvider";

const mockRouterPush = jest.fn();
let mockRootState: { key?: string } | undefined;

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
  useRootNavigationState: () => mockRootState,
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(async () => ({ type: "dismiss" })),
}));

type NotificationsMock = {
  __pushTestReset: () => void;
  __pushTestSetLastResponse: (response: {
    notification: {
      request: { content: { data: Record<string, unknown> } };
    };
  } | null) => void;
};

function notificationsMock(): NotificationsMock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- test helper
  return require("expo-notifications") as NotificationsMock;
}

function notificationWithSlug(slug: string) {
  return {
    notification: {
      request: {
        content: {
          data: {
            slug,
            url: `https://patonsports.com/blog/${slug}`,
          },
        },
      },
    },
  };
}

describe("PushAlertsProvider cold-start navigation", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    notificationsMock().__pushTestReset();
    mockRootState = undefined;
    mockRouterPush.mockClear();
  });

  it("waits for root navigation before pushing the article route", async () => {
    notificationsMock().__pushTestSetLastResponse(
      notificationWithSlug("week-01-pros-cons")
    );

    const screen = await render(
      <PushAlertsProvider>
        <Text>shell</Text>
      </PushAlertsProvider>
    );

    expect(mockRouterPush).not.toHaveBeenCalled();

    mockRootState = { key: "root" };
    await screen.rerender(
      <PushAlertsProvider>
        <Text>shell</Text>
      </PushAlertsProvider>
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/article/week-01-pros-cons"
      );
    });
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
  });
});
