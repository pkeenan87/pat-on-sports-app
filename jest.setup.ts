// Shared Jest mocks for native modules used by Phase 2 offline + Phase 3 audio.

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest mock factory
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-network", () => ({
  useNetworkState: () => ({
    type: "WIFI",
    isConnected: true,
    isInternetReachable: true,
  }),
  NetworkStateType: {
    NONE: "NONE",
    UNKNOWN: "UNKNOWN",
    CELLULAR: "CELLULAR",
    WIFI: "WIFI",
    BLUETOOTH: "BLUETOOTH",
    ETHERNET: "ETHERNET",
    WIMAX: "WIMAX",
    VPN: "VPN",
    OTHER: "OTHER",
  },
  getNetworkStateAsync: jest.fn(async () => ({
    type: "WIFI",
    isConnected: true,
    isInternetReachable: true,
  })),
}));

jest.mock("expo-image", () => ({
  Image: {
    prefetch: jest.fn(async () => true),
  },
}));

jest.mock("expo-audio", () => {
  const status = {
    currentTime: 0,
    duration: 0,
    playing: false,
    isLoaded: false,
    didJustFinish: false,
    playbackRate: 1,
  };

  const createPlayer = () => {
    const player = {
      play: jest.fn(() => {
        status.playing = true;
      }),
      pause: jest.fn(() => {
        status.playing = false;
      }),
      seekTo: jest.fn(async (seconds: number) => {
        status.currentTime = seconds;
      }),
      replace: jest.fn(() => {
        status.isLoaded = true;
      }),
      setPlaybackRate: jest.fn((rate: number) => {
        status.playbackRate = rate;
      }),
      setActiveForLockScreen: jest.fn(),
      clearLockScreenControls: jest.fn(),
      updateLockScreenMetadata: jest.fn(),
      remove: jest.fn(),
      get currentTime() {
        return status.currentTime;
      },
      get duration() {
        return status.duration;
      },
    };
    return player;
  };

  return {
    createAudioPlayer: jest.fn(() => createPlayer()),
    useAudioPlayer: jest.fn(() => createPlayer()),
    useAudioPlayerStatus: jest.fn(() => ({ ...status })),
    setAudioModeAsync: jest.fn(async () => undefined),
  };
});

jest.mock("expo-file-system", () => {
  class MockFile {
    uri: string;
    name: string;
    exists = false;
    constructor(...parts: unknown[]) {
      const joined = parts
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "uri" in part) {
            return String((part as { uri: string }).uri).replace(/\/$/, "");
          }
          return "";
        })
        .filter(Boolean)
        .join("/");
      this.uri = joined.startsWith("file://") ? joined : `file://${joined}`;
      this.name = this.uri.split("/").pop() ?? "file";
    }
    delete() {
      this.exists = false;
    }
    static createDownloadTask = jest.fn();
    static downloadFileAsync = jest.fn();
  }

  class MockDirectory {
    uri: string;
    exists = false;
    private files: MockFile[] = [];
    constructor(...parts: unknown[]) {
      const joined = parts
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "uri" in part) {
            return String((part as { uri: string }).uri).replace(/\/$/, "");
          }
          return "";
        })
        .filter(Boolean)
        .join("/");
      this.uri = joined.startsWith("file://") ? joined : `file://${joined}`;
    }
    create() {
      this.exists = true;
    }
    list() {
      return this.files;
    }
    __add(file: MockFile) {
      this.files.push(file);
    }
  }

  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: {
      document: { uri: "file:///documents" },
      cache: { uri: "file:///cache" },
    },
  };
});
