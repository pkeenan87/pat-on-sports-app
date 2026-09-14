import { Directory, File, Paths } from "expo-file-system";

export type DownloadStatus =
  | "idle"
  | "downloading"
  | "done"
  | "error"
  | "deleted";

export type DownloadState = {
  status: DownloadStatus;
  progress: number | null;
  errorMessage?: string;
};

export type DownloadAction =
  | { type: "start" }
  | { type: "progress"; progress: number | null }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "delete" }
  | { type: "reset" };

export const INITIAL_DOWNLOAD_STATE: DownloadState = {
  status: "idle",
  progress: null,
};

export function reduceDownloadState(
  state: DownloadState,
  action: DownloadAction
): DownloadState {
  switch (action.type) {
    case "start":
      return { status: "downloading", progress: 0 };
    case "progress":
      if (state.status !== "downloading") return state;
      return { ...state, progress: action.progress };
    case "done":
      return { status: "done", progress: 1 };
    case "error":
      return {
        status: "error",
        progress: null,
        errorMessage: action.message,
      };
    case "delete":
      return { status: "deleted", progress: null };
    case "reset":
      return INITIAL_DOWNLOAD_STATE;
    default:
      return state;
  }
}

const AUDIO_DIR_NAME = "audio";

type FileLike = {
  uri: string;
  exists: boolean;
  name: string;
  delete(): void;
};

type DirLike = {
  exists: boolean;
  create(options?: { intermediates?: boolean; idempotent?: boolean }): void;
  list(): FileLike[];
};

type FsApi = {
  getAudioDir(): DirLike;
  getAudioFile(slug: string, remoteUrl: string): FileLike;
  download(
    url: string,
    destination: FileLike,
    onProgress?: (progress: number | null) => void
  ): Promise<void>;
};

function extensionFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const match = path.match(/\.([a-z0-9]+)$/i);
    if (match) return match[1].toLowerCase();
  } catch {
    const match = url.match(/\.([a-z0-9]+)(\?|$)/i);
    if (match) return match[1].toLowerCase();
  }
  return "m4a";
}

export function audioFileName(slug: string, remoteUrl: string): string {
  return `${slug}.${extensionFromUrl(remoteUrl)}`;
}

let fsImpl: FsApi | null = null;

function defaultFs(): FsApi {
  return {
    getAudioDir() {
      const dir = new Directory(Paths.document, AUDIO_DIR_NAME);
      if (!dir.exists) {
        dir.create({ intermediates: true, idempotent: true });
      }
      return dir as unknown as DirLike;
    },
    getAudioFile(slug: string, remoteUrl: string) {
      const dir = this.getAudioDir();
      return new File(
        dir as unknown as Directory,
        audioFileName(slug, remoteUrl)
      ) as unknown as FileLike;
    },
    async download(url, destination, onProgress) {
      const file = destination as unknown as File;
      const task = File.createDownloadTask(url, file, {
        onProgress: ({ bytesWritten, totalBytes }) => {
          if (!onProgress) return;
          if (totalBytes > 0) {
            onProgress(bytesWritten / totalBytes);
          } else {
            onProgress(null);
          }
        },
      });
      await task.downloadAsync();
    },
  };
}

function fs(): FsApi {
  return fsImpl ?? defaultFs();
}

export function __setAudioFsForTests(impl: FsApi | null) {
  fsImpl = impl;
}

/** Find a downloaded file for this slug regardless of extension. */
export async function getLocalAudioUri(slug: string): Promise<string | null> {
  try {
    const dir = fs().getAudioDir();
    if (!dir.exists) return null;
    const match = dir.list().find((entry) => {
      const base = entry.name.replace(/\.[^.]+$/, "");
      return base === slug && entry.exists;
    });
    return match?.uri ?? null;
  } catch {
    return null;
  }
}

/**
 * Prefer a local download when present; otherwise the remote URL.
 */
export async function resolvePlaybackUri(
  slug: string,
  remoteUrl: string
): Promise<string> {
  const local = await getLocalAudioUri(slug);
  return local ?? remoteUrl;
}

export async function isAudioDownloaded(slug: string): Promise<boolean> {
  return (await getLocalAudioUri(slug)) != null;
}

export async function listDownloadedSlugs(): Promise<string[]> {
  try {
    const dir = fs().getAudioDir();
    if (!dir.exists) return [];
    return dir
      .list()
      .filter((entry) => entry.exists)
      .map((entry) => entry.name.replace(/\.[^.]+$/, ""));
  } catch {
    return [];
  }
}

export async function fetchContentLength(
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<number | null> {
  try {
    const response = await fetchImpl(url, { method: "HEAD" });
    const header =
      response.headers.get("content-length") ??
      response.headers.get("Content-Length");
    if (!header) return null;
    const n = Number(header);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

export async function downloadAudio(options: {
  slug: string;
  remoteUrl: string;
  onProgress?: (progress: number | null) => void;
}): Promise<string> {
  const { slug, remoteUrl, onProgress } = options;
  await deleteDownloadedAudio(slug);
  fs().getAudioDir();
  const destination = fs().getAudioFile(slug, remoteUrl);
  await fs().download(remoteUrl, destination, onProgress);
  return destination.uri;
}

export async function deleteDownloadedAudio(slug: string): Promise<void> {
  const dir = fs().getAudioDir();
  if (!dir.exists) return;
  for (const entry of dir.list()) {
    const base = entry.name.replace(/\.[^.]+$/, "");
    if (base === slug && entry.exists) {
      entry.delete();
    }
  }
}
