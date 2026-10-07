import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, ConfirmSheet } from '@/components/ui';
import { IconButton } from '@/features/exam/components/kit';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';
import { downloadMany, removeDownload } from './actions';
import { useEnsureDownloadAllowed } from './hooks';
import { useDownloadsStore } from './store';
import { downloadKey, type DownloadKind } from './types';

/**
 * Saves a whole group (e.g. every lesson of a grammar topic) in one tap. Only fetches what is
 * missing, so tapping again after a partial or failed run finishes the job; once everything is
 * saved the same button removes the group.
 */
export function DownloadAllButton({ kind, ids }: { kind: DownloadKind; ids: string[] }) {
  const { t } = useI18n();
  const d = t.downloads;
  const ensureAllowed = useEnsureDownloadAllowed();
  const items = useDownloadsStore((s) => s.items);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const saved = ids.filter((id) => downloadKey(kind, id) in items);
  const missing = ids.filter((id) => !(downloadKey(kind, id) in items));
  const complete = ids.length > 0 && missing.length === 0;
  if (ids.length === 0) return null;

  const start = async () => {
    if (!(await ensureAllowed())) return;
    setProgress({ done: 0, total: missing.length });
    const failed = await downloadMany(kind, missing, (done, total) => setProgress({ done, total }));
    setProgress(null);
    if (failed > 0) Alert.alert(d.title, d.failedSome(failed));
  };

  const label = progress
    ? d.downloadingProgress(progress.done, progress.total)
    : complete
      ? d.allDownloaded
      : saved.length > 0
        ? d.someDownloaded(saved.length, ids.length)
        : d.downloadAll(ids.length);

  return (
    <View style={styles.wrap}>
      <IconButton
        name={complete ? 'checkmark-circle' : 'download-outline'}
        label={label}
        color={complete ? colors.success : colors.ink}
        busy={!!progress}
        onPress={() => (complete ? setConfirmOpen(true) : void start())}
      />
      {progress ? (
        <AppText variant="caption" color={colors.mutedForeground}>
          {progress.done}/{progress.total}
        </AppText>
      ) : saved.length > 0 && !complete ? (
        <AppText variant="caption" color={colors.mutedForeground}>
          {saved.length}/{ids.length}
        </AppText>
      ) : null}
      <ConfirmSheet
        visible={confirmOpen}
        destructive
        title={d.removeCategoryTitle}
        message={d.removeCategoryMessage}
        confirmLabel={d.remove}
        onConfirm={() => {
          setConfirmOpen(false);
          void Promise.all(saved.map((id) => removeDownload(kind, id)));
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center' } });
