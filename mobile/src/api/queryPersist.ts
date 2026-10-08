import type { Query } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { fileStore } from '@/features/downloads/fileStore';

const PATH = 'query-cache.json';
const WRITE_DELAY_MS = 2000;

/**
 * Only course content is worth keeping across restarts: it is large, rarely changes and is what
 * makes the Grammar and Reading screens slow on a cold start. Per-user numbers (dashboard,
 * progress, AI usage) always load fresh. Everything is wiped on sign-out.
 */
const CONTENT_KEYS: Record<string, readonly string[]> = {
  grammar: ['lesson', 'navigation', 'category', 'level', 'level-summary'],
  reading: ['article', 'navigation', 'categories', 'level-summary'],
};

export function shouldPersistQuery(query: Query): boolean {
  if (query.state.status !== 'success') return false;
  const [scope, part] = query.queryKey as [string, string?];
  return !!part && !!CONTENT_KEYS[scope]?.includes(part);
}

/**
 * File-backed persister. The cache is saved at most every couple of seconds (it changes on every
 * tap) and kept in a plain file rather than AsyncStorage, which has a small size limit on Android.
 */
export function createQueryPersister(): Persister {
  let pending: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    timer = null;
    const client = pending;
    pending = null;
    if (client) await fileStore.writeText(PATH, JSON.stringify(client)).catch(() => undefined);
  };

  return {
    persistClient(client) {
      pending = client;
      timer ??= setTimeout(() => void flush(), WRITE_DELAY_MS);
    },
    async restoreClient() {
      try {
        const text = await fileStore.readText(PATH);
        return text ? (JSON.parse(text) as PersistedClient) : undefined;
      } catch {
        return undefined;
      }
    },
    async removeClient() {
      pending = null;
      if (timer) clearTimeout(timer);
      timer = null;
      await fileStore.remove(PATH).catch(() => undefined);
    },
  };
}
