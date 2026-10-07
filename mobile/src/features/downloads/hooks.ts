import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useI18n } from '@/i18n';
import { usePremiumUpsellStore } from '@/stores/premiumUpsellStore';
import { api } from '@/api/client';
import { downloadItem, removeDownload } from './actions';
import { useDownloadsStore, useIsDownloaded, useIsDownloading } from './store';
import type { DownloadKind } from './types';

export interface DownloadAccess {
  allowed: boolean;
  premiumOnly: boolean;
}

export const DOWNLOAD_ACCESS_KEY = ['downloads', 'access'] as const;

/** Whether this learner may save content offline (admin: everyone, or Premium only). */
export const useDownloadAccess = () =>
  useQuery({
    queryKey: DOWNLOAD_ACCESS_KEY,
    queryFn: () => api.get<DownloadAccess>('/downloads/access'),
    staleTime: 5 * 60_000,
    retry: false,
  });

/** Loads the on-device index once; call from the signed-in layout. */
export function useHydrateDownloads(): void {
  useEffect(() => {
    void useDownloadsStore.getState().hydrate();
  }, []);
}

export function useDownloadState(kind: DownloadKind, id: string) {
  return {
    downloaded: useIsDownloaded(kind, id),
    downloading: useIsDownloading(kind, id),
    download: () => downloadItem(kind, id),
    remove: () => removeDownload(kind, id),
  };
}

/**
 * Resolves true when this learner may download. Otherwise it has already told them why (the
 * Premium upsell, or a connection problem), so callers just stop.
 */
export function useEnsureDownloadAllowed(): () => Promise<boolean> {
  const { t } = useI18n();
  const access = useDownloadAccess();
  const refetch = access.refetch;
  const known = access.data;
  return useCallback(async () => {
    const result = known ?? (await refetch()).data;
    if (!result) {
      Alert.alert(t.downloads.title, t.downloads.accessUnknown);
      return false;
    }
    if (!result.allowed) {
      usePremiumUpsellStore.getState().open(t.downloads.premiumRequired);
      return false;
    }
    return true;
  }, [known, refetch, t]);
}
