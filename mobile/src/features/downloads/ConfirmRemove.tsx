import { ConfirmSheet } from '@/components/ui';
import { useI18n } from '@/i18n';

export function ConfirmRemove({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <ConfirmSheet
      visible={visible}
      destructive
      title={t.downloads.removeTitle}
      message={t.downloads.removeMessage}
      confirmLabel={t.downloads.remove}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
