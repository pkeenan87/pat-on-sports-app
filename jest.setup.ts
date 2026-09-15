// @ts-nocheck
// Shared Jest mocks for native modules used by Phase 2–4 (offline, audio, push).

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

  // Stable snapshot until notify — mirrors real status object identity updates.
  let statusSnapshot = { ...status };

  const listeners = new Set<() => void>();
  const notify = () => {
    statusSnapshot = { ...status };
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
      // Real player keeps the previous isLoaded until a later status event.
      // Do not flip isLoaded (or notify a loaded state) synchronously here.
      status.playing = false;
      status.currentTime = 0;
      status.didJustFinish = false;
      setTimeout(() => {
        status.isLoaded = true;
        notify();
      }, 0);
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
      return statusSnapshot;
    }),
    setAudioModeAsync: jest.fn(async () => undefined),
    __audioTestStatus: status,
    __audioTestPlayer: player,
    __audioTestNotify: notify,
    __audioTestResetStatus: () => {
      status.currentTime = 0;
      status.duration = 0;
      status.playing = false;
      status.isLoaded = false;
      status.didJustFinish = false;
      status.playbackRate = 1;
      statusSnapshot = { ...status };
    },
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

jest.mock("expo-device", () => {
  const state = { isDevice: true };
  return {
    get isDevice() {
      return state.isDevice;
    },
    __setIsDevice: (value) => {
      state.isDevice = value;
    },
    __resetIsDevice: () => {
      state.isDevice = true;
    },
  };
});

jest.mock("expo-notifications", () => {
  const listeners = new Set();
  let lastResponse = null;
  let permissionStatus = "undetermined";
  let canAskAgain = true;
  let pushToken = "ExponentPushToken[test-token]";

  return {
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(async () => ({
      status: permissionStatus,
      canAskAgain,
      granted: permissionStatus === "granted",
    })),
    requestPermissionsAsync: jest.fn(async () => {
      if (canAskAgain) {
        permissionStatus = "granted";
      }
      return {
        status: permissionStatus,
        canAskAgain,
        granted: permissionStatus === "granted",
      };
    }),
    getExpoPushTokenAsync: jest.fn(async () => ({ data: pushToken })),
    getLastNotificationResponse: jest.fn(() => lastResponse),
    addNotificationResponseReceivedListener: jest.fn((listener) => {
      listeners.add(listener);
      return {
        remove: () => {
          listeners.delete(listener);
        },
      };
    }),
    __pushTestSetDevicePermission: (opts) => {
      permissionStatus = opts.status;
      canAskAgain =
        opts.canAskAgain !== undefined
          ? opts.canAskAgain
          : opts.status !== "denied";
    },
    __pushTestSetToken: (token) => {
      pushToken = token;
    },
    __pushTestSetLastResponse: (response) => {
      lastResponse = response;
    },
    __pushTestEmitResponse: (response) => {
      for (const listener of listeners) {
        listener(response);
      }
    },
    __pushTestReset: () => {
      listeners.clear();
      lastResponse = null;
      permissionStatus = "undetermined";
      canAskAgain = true;
      pushToken = "ExponentPushToken[test-token]";
    },
  };
});

jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: "ae5408fc-cf1a-471f-9134-bd65dcef4efd",
      },
    },
  },
  easConfig: {
    projectId: "ae5408fc-cf1a-471f-9134-bd65dcef4efd",
  },
}));
