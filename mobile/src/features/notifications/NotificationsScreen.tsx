import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, DirectionalIcon, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { useI18n } from '@/i18n';
import { IconButton, PressableScale, tint } from '@/features/exam/components/kit';
import { colors, radius, spacing } from '@/theme';
import type { NotificationCategory, NotificationItem } from '@/types/notification';
import {
  useMarkAllRead,
  useNotificationList,
  useOpenNotification,
  useUnreadCount,
  type Tab,
} from './hooks';
import { inAppHref } from './destination';
import { dayBucket, relativeTime, type DayBucket } from './time';

/** Orange: the same colour as the notifications row and badge on the profile tab. */
const ACCENT = '#F2703D';
const ACCENT_DARK = '#C4501F';

const TABS: Tab[] = ['all', 'learning', 'progress', 'system'];

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

const CATEGORY_STYLE: Record<
  NotificationCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  LEARNING: { icon: 'book', color: '#4D94FF' },
  REMINDER: { icon: 'alarm', color: '#E8892B' },
  PROGRESS: { icon: 'trophy', color: '#27AE7A' },
  SYSTEM: { icon: 'settings', color: '#7B8498' },
  PREMIUM: { icon: 'star', color: '#8B5CF6' },
};

const TAB_ICON: Record<Tab, keyof typeof Ionicons.glyphMap> = {
  all: 'notifications-outline',
  learning: 'book-outline',
  progress: 'trophy-outline',
  system: 'settings-outline',
};

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const { t } = useI18n();
  const { icon, color } = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.SYSTEM;
  const goes = inAppHref(item.actionUrl) !== null;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? '' : t.notifications.unreadPrefix}${item.title}${item.body ? `. ${item.body}` : ''}`}
      onPress={onPress}
      style={[
        styles.row,
        !item.read && { borderColor: tint(color, '33'), backgroundColor: tint(color, '14') },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: tint(color, '1F') }]}>
        <Ionicons name={icon} size={22} color={color} />
        {!item.read ? <View style={styles.dot} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          variant="subheading"
          style={item.read ? { fontWeight: '500' } : { fontWeight: '800' }}
        >
          {item.title}
        </AppText>
        {item.body ? (
          <AppText variant="small" color={colors.mutedForeground}>
            {item.body}
          </AppText>
        ) : null}
        <AppText variant="caption" color={colors.mutedForeground}>
          {relativeTime(item.createdAt, t.notifications.time)}
        </AppText>
      </View>
      {goes ? (
        <DirectionalIcon name="chevron-forward" size={20} color={colors.mutedForeground} />
      ) : null}
    </PressableScale>
  );
}

/** A bell with the number of unread notifications — decoration that doubles as the summary. */
function BellBadge({ count }: { count: number }) {
  return (
    <View
      style={styles.bell}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons
        name={count > 0 ? 'notifications' : 'notifications-outline'}
        size={44}
        color={ACCENT}
      />
      {count > 0 ? (
        <View style={styles.bellCount}>
          <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export function NotificationsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const n = t.notifications;
  const [tab, setTab] = useState<Tab>('all');
  const list = useNotificationList(tab);
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const open = useOpenNotification();

  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const rows = useMemo(() => buildRows(items), [items]);

  const handleOpen = async (item: NotificationItem) => {
    const web = await open.mutateAsync(item);
    const href = inAppHref(web);
    if (href) router.push(href);
  };

  let empty = null;
  if (list.isPending) {
    empty = (
      <View accessibilityLabel={n.loading} style={{ gap: spacing.md }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={64} />
        ))}
      </View>
    );
  } else if (list.isError) {
    empty = <ErrorState error={list.error} onRetry={() => void list.refetch()} />;
  } else if (items.length === 0) {
    empty = <EmptyState emoji="🔔" title={n.emptyTitle} message={n.emptyMessage} />;
  }

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <View style={[styles.hero, { backgroundColor: tint(ACCENT, '1F') }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topRow}>
            <IconButton name="arrow-back" label={n.back} onPress={() => router.back()} />
            <IconButton
              name="settings-outline"
              label={n.settingsLabel}
              onPress={() => router.push('/settings/notification-preferences')}
            />
          </View>
          <View style={styles.heroMain}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText
                style={styles.title}
                accessibilityRole="header"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {n.title}
              </AppText>
              <AppText color={colors.ink} style={{ fontWeight: '500' }}>
                {unread.data ? n.unread(unread.data) : n.allRead}
              </AppText>
            </View>
            <BellBadge count={unread.data ?? 0} />
          </View>
          {unread.data ? (
            <View style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={n.markAllRead}
                disabled={markAll.isPending}
                onPress={() => markAll.mutate()}
                style={styles.markAll}
              >
                <Ionicons name="checkmark-done" size={18} color={ACCENT_DARK} />
                <AppText variant="small" color={ACCENT_DARK} style={{ fontWeight: '800' }}>
                  {n.markAllRead}
                </AppText>
              </PressableScale>
            </View>
          ) : null}
        </SafeAreaView>
      </View>

      <HorizontalScroll
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={{ flexGrow: 0 }}
      >
        {TABS.map((key) => {
          const on = tab === key;
          const label = n.tabs[key];
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: on }}
              onPress={() => setTab(key)}
              style={[styles.tab, on && { backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Ionicons name={TAB_ICON[key]} size={16} color={on ? '#FFFFFF' : colors.ink} />
              <AppText
                variant="small"
                color={on ? '#FFFFFF' : colors.ink}
                style={{ fontWeight: '700' }}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </HorizontalScroll>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        testID="notification-list"
        data={empty ? [] : rows}
        keyExtractor={(r) => (r.kind === 'header' ? `h-${r.bucket}` : r.item.id)}
        renderItem={({ item: r }) =>
          r.kind === 'header' ? (
            <View style={[styles.pad, { paddingTop: spacing.md }]}>
              <AppText
                variant="caption"
                color={colors.mutedForeground}
                style={{ fontWeight: '800' }}
              >
                {n.buckets[r.bucket].toUpperCase()}
              </AppText>
            </View>
          ) : (
            <View style={styles.pad}>
              <NotificationRow item={r.item} onPress={() => void handleOpen(r.item)} />
            </View>
          )
        }
        ListHeaderComponent={header}
        ListEmptyComponent={empty ? <View style={styles.pad}>{empty}</View> : null}
        ItemSeparatorComponent={Gap}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <View style={{ padding: spacing.lg }} accessibilityLabel={n.loadingMore}>
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

const Gap = () => <View style={{ height: spacing.sm }} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  pad: { paddingHorizontal: spacing.lg },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.sm,
    paddingEnd: spacing.sm,
  },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink },
  bell: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFFB3',
  },
  bellCount: {
    position: 'absolute',
    top: 2,
    end: 0,
    minWidth: 26,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 0,
    end: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ACCENT,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
