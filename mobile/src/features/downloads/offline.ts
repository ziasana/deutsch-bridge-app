import NetInfo from '@react-native-community/netinfo';
import { ApiError } from '@/api/errors';
import { isOffline } from '@/features/offline/useConnectivity';
import { outbox, type OutboxEntry } from './outbox';
import { downloadsStorage } from './storage';
import { useDownloadsStore } from './store';
import type { DownloadKind } from './types';

/** Fields both lesson and article payloads share, which offline progress changes. */
type Progressable = {
  title: string;
  level: string;
  bookmarked: boolean;
  learningProgresses: { id: string; learned: boolean }[];
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
};

async function deviceOffline(): Promise<boolean> {
  try {
    return isOffline(await NetInfo.fetch());
  } catch {
    return false;
  }
}

function applyEntry<T extends Progressable>(item: T, entry: OutboxEntry): T {
  return entry.field === 'learned'
    ? { ...item, learningProgresses: [{ id: 'local', learned: entry.value }] }
    : { ...item, bookmarked: entry.value };
}

/** Shows progress the learner made offline that the server hasn't received yet. */
async function withPending<T extends Progressable>(
  kind: DownloadKind,
  id: string,
  item: T,
): Promise<T> {
  const pending = await outbox.pending(kind, id);
  return pending.reduce<T>(applyEntry, item);
}

const isLocalUri = (uri: string | null | undefined): uri is string => !!uri?.startsWith('file:');

/** A refreshed copy keeps the images already saved on the device instead of the remote links. */
function keepLocalImages<T extends Progressable>(fresh: T, local: T): T {
  return {
    ...fresh,
    imageUrl: isLocalUri(local.imageUrl) ? local.imageUrl : fresh.imageUrl,
    thumbnailUrl: isLocalUri(local.thumbnailUrl) ? local.thumbnailUrl : fresh.thumbnailUrl,
  };
}

/**
 * Loads one lesson/article, preferring what is on the device when the network isn't available.
 * Online it behaves like the plain fetch and quietly refreshes a downloaded copy; offline (or when
 * the request fails for lack of a connection) a downloaded copy is returned instead of an error.
 */
export async function loadItem<T extends Progressable>(
  kind: DownloadKind,
  id: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const local = await downloadsStorage.read<T>(kind, id);
  if (local && (await deviceOffline())) return withPending(kind, id, local);

  try {
    const fresh = await fetcher();
    if (!local) return fresh;
    const merged = keepLocalImages(fresh, local);
    void downloadsStorage
      .write(kind, id, merged, { title: merged.title, level: merged.level })
      .then(useDownloadsStore.getState().setItems)
      .catch(() => undefined);
    return withPending(kind, id, merged);
  } catch (error) {
    if (local && error instanceof ApiError && error.kind === 'network') {
      return withPending(kind, id, local);
    }
    throw error;
  }
}

/** Mirrors a progress change into the downloaded copy so it is right the next time it opens offline. */
async function patchDownloaded(kind: DownloadKind, id: string, entry: OutboxEntry): Promise<void> {
  const local = await downloadsStorage.read<Progressable>(kind, id);
  if (!local) return;
  await downloadsStorage.write(kind, id, applyEntry(local, entry), {
    title: local.title,
    level: local.level,
  });
}

/**
 * Sends a progress change; if there is no connection it is queued and reported as done, because
 * the learner's screen already reflects it and it will be delivered when they are back online.
 */
export async function deliverOrQueue<R>(
  entry: OutboxEntry,
  send: () => Promise<R>,
): Promise<R | undefined> {
  try {
    const result = await send();
    await patchDownloaded(entry.kind, entry.id, entry).catch(() => undefined);
    return result;
  } catch (error) {
    if (!(error instanceof ApiError && error.kind === 'network')) throw error;
    await outbox.enqueue(entry);
    await patchDownloaded(entry.kind, entry.id, entry).catch(() => undefined);
    return undefined;
  }
}
