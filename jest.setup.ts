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
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest mock factory
  const React = require("react") as typeof import("react");

  const status = {
    currentTime: 0,
    duration: 0,
    playing: false,
    isLoaded: false,
    didJustFinish: false,
    playbackRate: 1,
  };

  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };

  const createPlayer = () => ({
    play: jest.fn(() => {
      status.playing = true;
      notify();
    }),
    pause: jest.fn(() => {
      status.playing = false;
      notify();
    }),
    seekTo: jest.fn(async (seconds: number) => {
      status.currentTime = seconds;
      notify();
    }),
    replace: jest.fn(() => {
      // Mimic async load: unload, then become ready on the next tick.
      status.isLoaded = false;
      status.playing = false;
      status.currentTime = 0;
      status.didJustFinish = false;
      notify();
      queueMicrotask(() => {
        status.isLoaded = true;
        notify();
      });
    }),
    setPlaybackRate: jest.fn((rate: number) => {
      status.playbackRate = rate;
      notify();
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
  });

  const player = createPlayer();

  return {
    createAudioPlayer: jest.fn(() => player),
    useAudioPlayer: jest.fn(() => player),
    useAudioPlayerStatus: jest.fn(() => {
      const [, setTick] = React.useState(0);
      React.useEffect(() => {
        const listener = () => setTick((n) => n + 1);
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      }, []);
      return { ...status };
    }),
    setAudioModeAsync: jest.fn(async () => undefined),
    __audioTestStatus: status,
    __audioTestNotify: notify,
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
