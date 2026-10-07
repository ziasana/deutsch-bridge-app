import { fileStore } from './fileStore';
import { downloadKey, type DownloadKind, type DownloadMeta } from './types';

const INDEX_PATH = 'index.json';
const contentPath = (kind: DownloadKind, id: string) => `${kind}/${id}.json`;
const imageDir = (kind: DownloadKind, id: string) => `${kind}/${id}`;
const imagePath = (kind: DownloadKind, id: string, name: string) => `${imageDir(kind, id)}/${name}`;

/**
 * Content saved on this device for offline use. A small index (what is downloaded) is kept apart
 * from the content files so listing never reads lesson bodies.
 */
async function readIndex(): Promise<Record<string, DownloadMeta>> {
  try {
    const text = await fileStore.readText(INDEX_PATH);
    return text ? (JSON.parse(text) as Record<string, DownloadMeta>) : {};
  } catch {
    return {};
  }
}

// Index writes are read-modify-write; serialising them keeps concurrent downloads from losing entries.
let indexQueue: Promise<unknown> = Promise.resolve();
function updateIndex(
  change: (index: Record<string, DownloadMeta>) => void,
): Promise<Record<string, DownloadMeta>> {
  const run = indexQueue.then(async () => {
    const index = await readIndex();
    change(index);
    await fileStore.writeText(INDEX_PATH, JSON.stringify(index));
    return index;
  });
  indexQueue = run.catch(() => undefined);
  return run;
}

export const downloadsStorage = {
  listIndex: readIndex,

  async read<T>(kind: DownloadKind, id: string): Promise<T | null> {
    try {
      const text = await fileStore.readText(contentPath(kind, id));
      return text ? (JSON.parse(text) as T) : null;
    } catch {
      return null;
    }
  },

  /** Saves (or refreshes) an item; the index entry keeps its original download date on refresh. */
  async write<T>(
    kind: DownloadKind,
    id: string,
    data: T,
    meta: { title: string; level: string; imageBytes?: number },
  ): Promise<Record<string, DownloadMeta>> {
    const text = JSON.stringify(data);
    await fileStore.writeText(contentPath(kind, id), text);
    return updateIndex((index) => {
      const key = downloadKey(kind, id);
      index[key] = {
        kind,
        id,
        title: meta.title,
        level: meta.level,
        bytes: text.length,
        imageBytes: meta.imageBytes ?? index[key]?.imageBytes ?? 0,
        downloadedAt: index[key]?.downloadedAt ?? new Date().toISOString(),
      };
    });
  },

  /** Saves a remote image with the item; returns its local uri and size. */
  saveImage: (kind: DownloadKind, id: string, name: string, url: string) =>
    fileStore.download(url, imagePath(kind, id, name)),

  async remove(kind: DownloadKind, id: string): Promise<Record<string, DownloadMeta>> {
    await fileStore.remove(contentPath(kind, id));
    return updateIndex((index) => {
      delete index[downloadKey(kind, id)];
    });
  },

  /** Images live in a folder named after their item; removed together with it. */
  removeImages: (kind: DownloadKind, id: string) =>
    fileStore.removeDir(imageDir(kind, id)).catch(() => undefined),

  async clear(): Promise<void> {
    await indexQueue;
    await fileStore.removeAll();
  },
};
