import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Card, ConfirmSheet, WavePage } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';
import { removeDownload } from './actions';
import { ConfirmRemove } from './ConfirmRemove';
import { formatBytes } from './format';
import { useDownloadsStore } from './store';
import type { DownloadKind, DownloadMeta } from './types';

function Section({
  title,
  items,
  onOpen,
  onRemove,
}: {
  title: string;
  items: DownloadMeta[];
  onOpen: (item: DownloadMeta) => void;
  onRemove: (item: DownloadMeta) => void;
}) {
  const { t } = useI18n();
  if (items.length === 0) return null;
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={styles.sectionHead}>
        <AppText variant="subheading">{title}</AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {t.downloads.count(items.length)}
        </AppText>
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => onOpen(item)}
            style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.6 }]}
          >
            <AppText numberOfLines={2}>{item.title}</AppText>
            <AppText variant="caption" color={colors.mutedForeground}>
              {item.level} · {formatBytes(item.bytes + (item.imageBytes ?? 0))}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.downloads.remove}: ${item.title}`}
            onPress={() => onRemove(item)}
            hitSlop={spacing.sm}
          >
            <Ionicons name="trash-outline" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

/** What is saved on this device, with its size, and a way to delete it. */
export function DownloadsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const items = useDownloadsStore((s) => s.items);
  const reset = useDownloadsStore((s) => s.reset);
  const [pending, setPending] = useState<DownloadMeta | null>(null);
  const [removeAllOpen, setRemoveAllOpen] = useState(false);

  const all = Object.values(items).sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
  const ofKind = (kind: DownloadKind) => all.filter((i) => i.kind === kind);
  const totalBytes = all.reduce((sum, i) => sum + i.bytes + (i.imageBytes ?? 0), 0);

  const open = (item: DownloadMeta) =>
    item.kind === 'grammar'
      ? router.push({ pathname: '/grammar/[lessonId]', params: { lessonId: item.id } })
      : router.push({ pathname: '/reading/[articleId]', params: { articleId: item.id } });

  return (
    <WavePage title={t.downloads.title}>
      {all.length === 0 ? (
        <Card>
          <AppText color={colors.mutedForeground}>{t.downloads.empty}</AppText>
        </Card>
      ) : (
        <>
          <AppText variant="small" color={colors.mutedForeground}>
            {t.downloads.storage(formatBytes(totalBytes))}
          </AppText>
          <Section
            title={t.downloads.grammar}
            items={ofKind('grammar')}
            onOpen={open}
            onRemove={setPending}
          />
          <Section
            title={t.downloads.reading}
            items={ofKind('reading')}
            onOpen={open}
            onRemove={setPending}
          />
          <Button
            pill
            variant="secondary"
            label={t.downloads.removeAll}
            onPress={() => setRemoveAllOpen(true)}
          />
        </>
      )}
      <AppText variant="small" color={colors.mutedForeground}>
        {t.downloads.offlineNote}
      </AppText>

      <ConfirmRemove
        visible={!!pending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) void removeDownload(pending.kind, pending.id);
          setPending(null);
        }}
      />
      <ConfirmSheet
        visible={removeAllOpen}
        destructive
        title={t.downloads.removeAllTitle}
        message={t.downloads.removeAllMessage}
        confirmLabel={t.downloads.removeAll}
        onConfirm={() => {
          setRemoveAllOpen(false);
          void reset();
        }}
        onCancel={() => setRemoveAllOpen(false)}
      />
    </WavePage>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  rowMain: { flex: 1, gap: 2 },
});
