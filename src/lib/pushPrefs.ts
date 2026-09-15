import AsyncStorage from "@react-native-async-storage/async-storage";

const OPEN_COUNT_KEY = "push-article-open-count-v1";
const EXPLAINER_OUTCOME_KEY = "push-explainer-outcome-v1";
const ALERTS_ENABLED_KEY = "push-alerts-enabled-v1";
const TOKEN_KEY = "push-token-v1";

export type ExplainerOutcome = "dismissed" | "prompted";

export const PUSH_EXPLAINER_OPEN_THRESHOLD = 2;

export async function getArticleOpenCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(OPEN_COUNT_KEY);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function incrementArticleOpenCount(): Promise<number> {
  const next = (await getArticleOpenCount()) + 1;
  await AsyncStorage.setItem(OPEN_COUNT_KEY, String(next));
  return next;
}

export async function getExplainerOutcome(): Promise<ExplainerOutcome | null> {
  const raw = await AsyncStorage.getItem(EXPLAINER_OUTCOME_KEY);
  if (raw === "dismissed" || raw === "prompted") return raw;
  return null;
}

export async function setExplainerOutcome(
  outcome: ExplainerOutcome
): Promise<void> {
  await AsyncStorage.setItem(EXPLAINER_OUTCOME_KEY, outcome);
}

export async function getAlertsEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ALERTS_ENABLED_KEY)) === "1";
}

export async function setAlertsEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem(ALERTS_ENABLED_KEY, "1");
  } else {
    await AsyncStorage.removeItem(ALERTS_ENABLED_KEY);
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredPushToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredPushToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Pure gate: show the in-app explainer only after two article opens,
 * and never again once the reader dismissed or tapped Turn on.
 */
export function shouldShowPushExplainer(options: {
  openCount: number;
  explainerOutcome: ExplainerOutcome | null;
  alertsEnabled: boolean;
}): boolean {
  if (options.alertsEnabled) return false;
  if (options.explainerOutcome != null) return false;
  return options.openCount >= PUSH_EXPLAINER_OPEN_THRESHOLD;
}

export async function recordArticleOpenAndShouldPrompt(): Promise<boolean> {
  const openCount = await incrementArticleOpenCount();
  const [explainerOutcome, alertsEnabled] = await Promise.all([
    getExplainerOutcome(),
    getAlertsEnabled(),
  ]);
  return shouldShowPushExplainer({
    openCount,
    explainerOutcome,
    alertsEnabled,
  });
}
