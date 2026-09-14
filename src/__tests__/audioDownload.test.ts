import {
  __setAudioFsForTests,
  audioFileName,
  deleteDownloadedAudio,
  downloadAudio,
  getLocalAudioUri,
  INITIAL_DOWNLOAD_STATE,
  reduceDownloadState,
  resolvePlaybackUri,
} from "../lib/audioDownload";

describe("reduceDownloadState", () => {
  it("moves idle → downloading → done", () => {
    let state = INITIAL_DOWNLOAD_STATE;
    state = reduceDownloadState(state, { type: "start" });
    expect(state).toEqual({ status: "downloading", progress: 0 });
    state = reduceDownloadState(state, { type: "progress", progress: 0.4 });
    expect(state.status).toBe("downloading");
    expect(state.progress).toBe(0.4);
    state = reduceDownloadState(state, { type: "done" });
    expect(state).toEqual({ status: "done", progress: 1 });
  });

  it("records error and delete", () => {
    let state = reduceDownloadState(INITIAL_DOWNLOAD_STATE, { type: "start" });
    state = reduceDownloadState(state, {
      type: "error",
      message: "network",
    });
    expect(state.status).toBe("error");
    expect(state.errorMessage).toBe("network");
    state = reduceDownloadState(state, { type: "delete" });
    expect(state.status).toBe("deleted");
  });

  it("resets to idle", () => {
    const done = reduceDownloadState(INITIAL_DOWNLOAD_STATE, { type: "done" });
    expect(reduceDownloadState(done, { type: "reset" })).toEqual(
      INITIAL_DOWNLOAD_STATE
    );
  });
});

describe("audio downloads", () => {
  type StoreFile = { uri: string; name: string; exists: boolean; delete: () => void };
  let files: StoreFile[];

  beforeEach(() => {
    files = [];
    __setAudioFsForTests({
      getAudioDir() {
        return {
          exists: true,
          create() {},
          list: () => files,
        };
      },
      getAudioFile(slug, remoteUrl) {
        const name = audioFileName(slug, remoteUrl);
        const existing = files.find((f) => f.name === name);
        if (existing) return existing;
        const file: StoreFile = {
          uri: `file:///documents/audio/${name}`,
          name,
          exists: false,
          delete() {
            this.exists = false;
            files = files.filter((f) => f !== file);
          },
        };
        return file;
      },
      async download(_url, destination, onProgress) {
        onProgress?.(0.5);
        destination.exists = true;
        if (!files.includes(destination as StoreFile)) {
          files.push(destination as StoreFile);
        }
        onProgress?.(1);
      },
    });
  });

  afterEach(() => {
    __setAudioFsForTests(null);
  });

  it("names files by slug and url extension", () => {
    expect(
      audioFileName(
        "recap",
        "https://cdn.example.com/audio/recap.m4a"
      )
    ).toBe("recap.m4a");
  });

  it("downloads, prefers local uri, then deletes", async () => {
    const remote = "https://cdn.example.com/audio/recap.m4a";
    expect(await resolvePlaybackUri("recap", remote)).toBe(remote);

    const uri = await downloadAudio({ slug: "recap", remoteUrl: remote });
    expect(uri).toBe("file:///documents/audio/recap.m4a");
    expect(await getLocalAudioUri("recap")).toBe(uri);
    expect(await resolvePlaybackUri("recap", remote)).toBe(uri);

    await deleteDownloadedAudio("recap");
    expect(await getLocalAudioUri("recap")).toBeNull();
    expect(await resolvePlaybackUri("recap", remote)).toBe(remote);
  });
});
