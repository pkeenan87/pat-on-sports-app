import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getArticleOpenCount,
  getExplainerOutcome,
  recordArticleOpenAndShouldPrompt,
  setAlertsEnabled,
  setExplainerOutcome,
  shouldShowPushExplainer,
} from "../lib/pushPrefs";

describe("push open-count gate", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("does not prompt before two article opens", async () => {
    expect(await recordArticleOpenAndShouldPrompt()).toBe(false);
    expect(await getArticleOpenCount()).toBe(1);
    expect(await recordArticleOpenAndShouldPrompt()).toBe(true);
    expect(await getArticleOpenCount()).toBe(2);
  });

  it("prompts only once until an outcome is recorded", async () => {
    await recordArticleOpenAndShouldPrompt();
    expect(await recordArticleOpenAndShouldPrompt()).toBe(true);
    expect(await recordArticleOpenAndShouldPrompt()).toBe(true);

    await setExplainerOutcome("prompted");
    expect(await recordArticleOpenAndShouldPrompt()).toBe(false);
  });

  it("never asks again automatically after Not now", async () => {
    await recordArticleOpenAndShouldPrompt();
    await recordArticleOpenAndShouldPrompt();
    await setExplainerOutcome("dismissed");

    expect(await getExplainerOutcome()).toBe("dismissed");
    expect(await recordArticleOpenAndShouldPrompt()).toBe(false);
    expect(await recordArticleOpenAndShouldPrompt()).toBe(false);
    expect(
      shouldShowPushExplainer({
        openCount: 99,
        explainerOutcome: "dismissed",
        alertsEnabled: false,
      })
    ).toBe(false);
  });

  it("does not prompt when alerts are already enabled", async () => {
    await setAlertsEnabled(true);
    await recordArticleOpenAndShouldPrompt();
    expect(await recordArticleOpenAndShouldPrompt()).toBe(false);
  });
});
