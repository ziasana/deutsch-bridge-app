import { useState } from 'react';
import { Alert, View } from 'react-native';
import { readingApi, type ReadingListParams } from '@/api/readingApi';
import { Button, ConfirmSheet } from '@/components/ui';
import { downloadMany } from '@/features/downloads/actions';
import { useEnsureDownloadAllowed } from '@/features/downloads/hooks';
import { useDownloadsStore } from '@/features/downloads/store';
import { downloadKey } from '@/features/downloads/types';
import { useI18n } from '@/i18n';

/** Above this many new articles the learner confirms first: pictures make it a big download. */
export const LARGE_DOWNLOAD = 20;
const PAGE = 50;

/** Every article id matching the filters, paging through the list like the screen does. */
export async function collectArticleIds(params: ReadingListParams): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 0; ; page += 1) {
    const result = await readingApi.page(params, page, PAGE);
    ids.push(...result.items.map((a) => a.id));
    if (page + 1 >= result.totalPages) return ids;
  }
}

/**
 * "Download these articles" for the current topic or saved filter. Skips what is already on the
 * device, so running it again only fetches what is missing.
 */
export function ReadingDownloadBar({
  params,
  total,
}: {
  params: ReadingListParams;
  total: number;
}) {
  const { t } = useI18n();
  const d = t.downloads;
  const ensureAllowed = useEnsureDownloadAllowed();
  const [busy, setBusy] = useState<string | null>(null);
  const [toConfirm, setToConfirm] = useState<string[] | null>(null);

  const run = async (ids: string[]) => {
    setBusy(d.downloadingProgress(0, ids.length));
    const failed = await downloadMany('reading', ids, (done, all) =>
      setBusy(d.downloadingProgress(done, all)),
    );
    setBusy(null);
    if (failed > 0) Alert.alert(d.title, d.failedSome(failed));
  };

  const start = async () => {
    if (!(await ensureAllowed())) return;
    setBusy(d.downloading);
    let missing: string[];
    try {
      const saved = useDownloadsStore.getState().items;
      missing = (await collectArticleIds(params)).filter(
        (id) => !(downloadKey('reading', id) in saved),
      );
    } catch {
      setBusy(null);
      return Alert.alert(d.title, d.failed);
    }
    setBusy(null);
    if (missing.length === 0) return Alert.alert(d.title, d.articlesDownloaded);
    if (missing.length > LARGE_DOWNLOAD) return setToConfirm(missing);
    await run(missing);
  };

  return (
    <View>
      <Button
        pill
        variant="secondary"
        label={busy ?? d.downloadArticles(total)}
        loading={!!busy}
        onPress={() => void start()}
      />
      <ConfirmSheet
        visible={!!toConfirm}
        title={d.largeTitle}
        message={d.largeMessage(toConfirm?.length ?? 0)}
        confirmLabel={d.downloadConfirm}
        onConfirm={() => {
          const ids = toConfirm ?? [];
          setToConfirm(null);
          void run(ids);
        }}
        onCancel={() => setToConfirm(null)}
      />
    </View>
  );
}
