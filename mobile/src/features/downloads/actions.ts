import { grammarApi } from '@/api/grammarApi';
import { readingApi } from '@/api/readingApi';
import { resolveUploadUrl } from '@/utils/urls';
import type { GrammarLesson } from '@/types/grammar';
import type { ReadingArticle } from '@/types/reading';
import { downloadsStorage } from './storage';
import { useDownloadsStore } from './store';
import { downloadKey, type DownloadKind } from './types';

async function saveGrammar(id: string) {
  const lesson: GrammarLesson = await grammarApi.lesson(id);
  return downloadsStorage.write('grammar', id, lesson, {
    title: lesson.title,
    level: lesson.level,
  });
}

/** Images are best effort: an article without its picture is still worth having offline. */
async function localImage(
  id: string,
  name: string,
  url: string | null,
): Promise<{ uri: string | null; bytes: number }> {
  // Uploaded images are stored as "/uploads/..." paths that only resolve against the API host.
  const remote = resolveUploadUrl(url);
  if (!remote) return { uri: null, bytes: 0 };
  try {
    return await downloadsStorage.saveImage('reading', id, name, remote);
  } catch {
    return { uri: remote, bytes: 0 };
  }
}

async function saveReading(id: string) {
  const article: ReadingArticle = await readingApi.article(id);
  const cover = await localImage(id, 'cover', article.imageUrl);
  const thumb = await localImage(id, 'thumb', article.thumbnailUrl);
  const stored = { ...article, imageUrl: cover.uri, thumbnailUrl: thumb.uri };
  return downloadsStorage.write('reading', id, stored, {
    title: article.title,
    level: article.level,
    imageBytes: cover.bytes + thumb.bytes,
  });
}

/** Downloads (or refreshes) one lesson/article. Throws if the network or storage fails. */
export async function downloadItem(kind: DownloadKind, id: string): Promise<void> {
  const store = useDownloadsStore.getState();
  const key = downloadKey(kind, id);
  store.setBusy(key, true);
  try {
    store.setItems(await (kind === 'grammar' ? saveGrammar(id) : saveReading(id)));
  } finally {
    store.setBusy(key, false);
  }
}

export async function removeDownload(kind: DownloadKind, id: string): Promise<void> {
  await downloadsStorage.removeImages(kind, id);
  useDownloadsStore.getState().setItems(await downloadsStorage.remove(kind, id));
}

/**
 * Downloads a list of items a few at a time; resolves with how many failed. One failure doesn't
 * stop the rest, so a flaky connection leaves a partial set the learner can top up later.
 */
export async function downloadMany(
  kind: DownloadKind,
  ids: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const queue = [...ids];
  let done = 0;
  let failed = 0;
  const worker = async () => {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      try {
        await downloadItem(kind, id);
      } catch {
        failed += 1;
      }
      onProgress?.(++done, ids.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, ids.length) }, worker));
  return failed;
}
