import {
  formatDuration,
  formatFileSize,
  formatRemaining,
  nextPlaybackSpeed,
} from "../lib/audioFormat";

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(501)).toBe("8:21");
  });

  it("formats hours when needed", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("handles null and invalid values", () => {
    expect(formatDuration(null)).toBe("0:00");
    expect(formatDuration(undefined)).toBe("0:00");
    expect(formatDuration(Number.NaN)).toBe("0:00");
  });
});

describe("formatRemaining", () => {
  it("appends left", () => {
    expect(formatRemaining(90)).toBe("1:30 left");
  });
});

describe("nextPlaybackSpeed", () => {
  it("cycles through site speeds", () => {
    expect(nextPlaybackSpeed(1)).toBe(1.25);
    expect(nextPlaybackSpeed(1.25)).toBe(1.5);
    expect(nextPlaybackSpeed(1.5)).toBe(1.75);
    expect(nextPlaybackSpeed(1.75)).toBe(2);
    expect(nextPlaybackSpeed(2)).toBe(1);
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
