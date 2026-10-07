import { create } from 'zustand';
import { downloadsStorage } from './storage';
import { downloadKey, type DownloadKind, type DownloadMeta } from './types';

type DownloadsState = {
  items: Record<string, DownloadMeta>;
  hydrated: boolean;
  /** Keys currently being downloaded, for progress UI. */
  busy: ReadonlySet<string>;
  hydrate: () => Promise<void>;
  setItems: (items: Record<string, DownloadMeta>) => void;
  setBusy: (key: string, busy: boolean) => void;
  reset: () => Promise<void>;
};

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  items: {},
  hydrated: false,
  busy: new Set(),
  async hydrate() {
    if (get().hydrated) return;
    set({ items: await downloadsStorage.listIndex(), hydrated: true });
  },
  setItems: (items) => set({ items }),
  setBusy: (key, busy) =>
    set((s) => {
      const next = new Set(s.busy);
      if (busy) next.add(key);
      else next.delete(key);
      return { busy: next };
    }),
  /** Sign-out: another account must never see this one's downloads. */
  async reset() {
    await downloadsStorage.clear();
    set({ items: {}, hydrated: true, busy: new Set() });
  },
}));

export const useIsDownloaded = (kind: DownloadKind, id: string) =>
  useDownloadsStore((s) => downloadKey(kind, id) in s.items);

export const useIsDownloading = (kind: DownloadKind, id: string) =>
  useDownloadsStore((s) => s.busy.has(downloadKey(kind, id)));
