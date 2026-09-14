import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  clearPosition,
  getAllPositions,
  getLastPlayedSlug,
  getPosition,
  hasResumePosition,
  savePosition,
  setLastPlayedSlug,
  shouldSavePeriodicPosition,
} from "../lib/audioPosition";

describe("audio position persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("saves and restores a position", async () => {
    await savePosition("recap", 42.5);
    expect(await getPosition("recap")).toBe(42.5);
    expect(await getAllPositions()).toEqual({ recap: 42.5 });
  });

  it("clears a position on end", async () => {
    await savePosition("recap", 100);
    await clearPosition("recap");
    expect(await getPosition("recap")).toBeNull();
  });

  it("stores the last-played slug", async () => {
    await setLastPlayedSlug("recap");
    expect(await getLastPlayedSlug()).toBe("recap");
  });

  it("detects resume-worthy positions", () => {
    expect(hasResumePosition(30, 501)).toBe(true);
    expect(hasResumePosition(500, 501)).toBe(false);
    expect(hasResumePosition(0, 501)).toBe(false);
    expect(hasResumePosition(null, 501)).toBe(false);
  });

  it("gates periodic saves to every 10 seconds", () => {
    expect(shouldSavePeriodicPosition(5, null)).toBe(false);
    expect(shouldSavePeriodicPosition(10, null)).toBe(true);
    expect(shouldSavePeriodicPosition(19, 10)).toBe(false);
    expect(shouldSavePeriodicPosition(20, 10)).toBe(true);
  });
});
