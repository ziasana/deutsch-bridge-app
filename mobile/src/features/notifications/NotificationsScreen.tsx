import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Chip, EmptyState, ErrorState, Header, Skeleton } from '@/components/ui';
import { toMobileHref } from '@/features/dashboard/routes';
import { MIN_TOUCH, colors, spacing } from '@/theme';
import type { NotificationItem } from '@/types/notification';
import {
  useMarkAllRead,
  useNotificationList,
  useOpenNotification,
  useUnreadCount,
  type Tab,
} from './hooks';
import { BUCKET_LABEL, dayBucket, relativeTimeDe, type DayBucket } from './time';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'learning', label: 'Lernen' },
  { key: 'progress', label: 'Fortschritt' },
  { key: 'system', label: 'System' },
];

type Row = { kind: 'header'; bucket: DayBucket } | { kind: 'item'; item: NotificationItem };

/** Day headers + items in one flat, virtualized list. */
export function buildRows(items: NotificationItem[], now = new Date()): Row[] {
  const rows: Row[] = [];
  for (const bucket of ['today', 'yesterday', 'earlier'] as const) {
    const inBucket = items.filter((n) => dayBucket(n.createdAt, now) === bucket);
    if (inBucket.length === 0) continue;
    rows.push({ kind: 'header', bucket });
    for (const item of inBucket) rows.push({ kind: 'item', item });
  }
  return rows;
}

// An unknown destination resolves to this very screen, which means "stay here".
const NO_DESTINATION = '/settings/notifications' as const;

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? '' : 'Ungelesen: '}${item.title}${item.body ? `. ${item.body}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.accent }]}
    >
      <View style={[styles.dot, { backgroundColor: item.read ? 'transparent' : colors.primary }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subheading" style={item.read ? { fontWeight: '500' } : undefined}>
          {item.title}
        </AppText>
        {item.body ? <AppText color={colors.mutedForeground}>{item.body}</AppText> : null}
        <AppText variant="caption" color={colors.mutedForeground}>
          {relativeTimeDe(item.createdAt)}
        </AppText>
      </View>
    </Pressable>
  );
}

export function NotificationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  const list = useNotificationList(tab);
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const open = useOpenNotification();

  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const rows = useMemo(() => buildRows(items), [items]);

  const handleOpen = async (item: NotificationItem) => {
    const web = await open.mutateAsync(item);
    // Only in-app paths are followed (a guard against anything else the server might send).
    if (!web || !web.startsWith('/') || web.startsWith('//')) return;
    const href = toMobileHref(web, NO_DESTINATION);
    if (href !== NO_DESTINATION) router.push(href);
  };

  let empty = null;
  if (list.isPending) {
    empty = (
      <View accessibilityLabel="Benachrichtigungen werden geladen" style={{ gap: spacing.md }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={64} />
        ))}
      </View>
    );
  } else if (list.isError) {
    empty = <ErrorState error={list.error} onRetry={() => void list.refetch()} />;
  } else if (items.length === 0) {
    empty = (
      <EmptyState
        emoji="🔔"
        title="Keine Benachrichtigungen"
        message="Hier erscheinen Erinnerungen und Fortschritts-Meldungen."
      />
    );
  }

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      <Header title="Notifications" subtitle={unread.data ? `${unread.data} ungelesen` : 'Alles gelesen'} back />
      <View style={styles.actions}>
        {unread.data ? (
          <Pressable accessibilityRole="button" onPress={() => markAll.mutate()} disabled={markAll.isPending}>
            <AppText color={colors.primaryDark}>Alle als gelesen markieren</AppText>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Benachrichtigungs-Einstellungen"
          onPress={() => router.push('/settings/notification-preferences')}
        >
          <AppText color={colors.primaryDark}>⚙️ Einstellungen</AppText>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {TABS.map((t) => (
          <Chip key={t.key} label={t.label} selected={tab === t.key} onPress={() => setTab(t.key)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <FlatList
        testID="notification-list"
        data={empty ? [] : rows}
        keyExtractor={(r) => (r.kind === 'header' ? `h-${r.bucket}` : r.item.id)}
        renderItem={({ item: r }) =>
          r.kind === 'header' ? (
            <AppText variant="caption" color={colors.mutedForeground} style={{ paddingTop: spacing.md }}>
              {BUCKET_LABEL[r.bucket].toUpperCase()}
            </AppText>
          ) : (
            <NotificationRow item={r.item} onPress={() => void handleOpen(r.item)} />
          )
        }
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <View style={{ padding: spacing.lg }} accessibilityLabel="Weitere Benachrichtigungen werden geladen">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage && !list.isPending}
            onRefresh={() => {
              void list.refetch();
              void unread.refetch();
            }}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: MIN_TOUCH - 8 },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md, minHeight: MIN_TOUCH },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
});
