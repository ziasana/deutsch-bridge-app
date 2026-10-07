import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '@/api/errors';
import { grammarApi } from '@/api/grammarApi';
import { readingApi } from '@/api/readingApi';
import type { DownloadKind } from './types';

/**
 * Progress made without a connection. Each entry is the learner's latest wish for one flag of one
 * item ("learned", "bookmarked"), so a later tap replaces an earlier one instead of queueing both.
 * Entries are replayed in order when the app is online again.
 */
export type OutboxEntry = {
  field: 'learned' | 'bookmarked';
  kind: DownloadKind;
  id: string;
  value: boolean;
};

const STORAGE_KEY = 'downloads.outbox';

const sameTarget = (a: OutboxEntry, b: OutboxEntry) =>
  a.field === b.field && a.kind === b.kind && a.id === b.id;

async function load(): Promise<OutboxEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OutboxEntry[]) : [];
  } catch {
    return [];
  }
}

async function save(entries: OutboxEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable: the change is lost, as it would be without an outbox */
  }
}

/** Replays one entry against the API. */
async function send(entry: OutboxEntry): Promise<void> {
  if (entry.field === 'learned') {
    await (entry.kind === 'grammar'
      ? grammarApi.setLearned(entry.id, entry.value)
      : readingApi.setLearned(entry.id, entry.value));
    return;
  }
  const api = entry.kind === 'grammar' ? grammarApi : readingApi;
  await (entry.value ? api.addBookmark(entry.id) : api.removeBookmark(entry.id));
}

let flushing: Promise<number> | null = null;

/** Removes a delivered entry unless the learner changed that flag again while it was being sent. */
async function drop(entry: OutboxEntry): Promise<void> {
  const latest = await load();
  await save(latest.filter((e) => !(sameTarget(e, entry) && e.value === entry.value)));
}

export const outbox = {
  list: load,

  async enqueue(entry: OutboxEntry): Promise<void> {
    const entries = (await load()).filter((e) => !sameTarget(e, entry));
    await save([...entries, entry]);
  },

  /** Queued changes for one item, so screens can show them before they are delivered. */
  async pending(kind: DownloadKind, id: string): Promise<OutboxEntry[]> {
    return (await load()).filter((e) => e.kind === kind && e.id === id);
  },

  /**
   * Sends everything queued; resolves with how many entries were delivered. Stops at the first
   * connection or server failure (still offline) and keeps the rest; entries the server rejects
   * are dropped so one stale item can't block the queue forever.
   */
  flush(): Promise<number> {
    flushing ??= (async () => {
      let delivered = 0;
      for (;;) {
        const [head] = await load();
        if (!head) break;
        try {
          await send(head);
          delivered += 1;
        } catch (error) {
          const retryLater =
            error instanceof ApiError && ['network', 'server', 'unauthorized'].includes(error.kind);
          if (retryLater) break;
        }
        await drop(head);
      }
      return delivered;
    })().finally(() => {
      flushing = null;
    });
    return flushing;
  },

  clear: () => AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined),
};
