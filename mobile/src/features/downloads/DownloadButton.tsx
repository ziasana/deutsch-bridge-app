import { Alert } from 'react-native';
import { useState } from 'react';
import { IconButton } from '@/features/exam/components/kit';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';
import { useDownloadState, useEnsureDownloadAllowed } from './hooks';
import { ConfirmRemove } from './ConfirmRemove';
import type { DownloadKind } from './types';

/** Download / downloaded toggle for one lesson or article, gated by the admin's Premium setting. */
export function DownloadButton({ kind, id }: { kind: DownloadKind; id: string }) {
  const { t } = useI18n();
  const d = t.downloads;
  const ensureAllowed = useEnsureDownloadAllowed();
  const { downloaded, downloading, download, remove } = useDownloadState(kind, id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const start = async () => {
    if (!(await ensureAllowed())) return;
    try {
      await download();
    } catch {
      Alert.alert(d.title, d.failed);
    }
  };

  return (
    <>
      <IconButton
        name={downloaded ? 'checkmark-circle' : 'download-outline'}
        label={downloading ? d.downloading : downloaded ? d.downloaded : d.download}
        color={downloaded ? colors.success : colors.ink}
        busy={downloading}
        onPress={() => (downloaded ? setConfirmOpen(true) : void start())}
      />
      <ConfirmRemove
        visible={confirmOpen}
        onConfirm={() => {
          setConfirmOpen(false);
          void remove();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
