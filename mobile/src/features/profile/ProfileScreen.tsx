import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, ConfirmSheet, FocusedLightStatusBar, WaveBackdrop } from '@/components/ui';
import { useHeaderScroll } from '@/components/ui/useHeaderScroll';
import { totals, buildAchievements } from '@/features/achievements/model';
import { useDashboard } from '@/features/dashboard/hooks';
import { useUnreadCount } from '@/features/notifications/hooks';
import { useProgressOverview, useProgressStats } from '@/features/progress/hooks';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { Avatar } from './Avatar';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Row = {
  key: string;
  title: string;
  icon: IconName;
  color: string;
  href: Href;
  badge?: { text: string; color: string };
};

function MenuRow({ row, onPress }: { row: Row; onPress: () => void }) {
  const { isRTL } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.badge ? `${row.title}, ${row.badge.text}` : row.title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: row.color }]}>
        <Ionicons name={row.icon} size={22} color="#FFFFFF" />
      </View>
      <AppText style={styles.rowTitle} numberOfLines={2}>
        {row.title}
      </AppText>
      {row.badge ? (
        <View style={[styles.badge, { backgroundColor: row.badge.color }]}>
          <AppText variant="caption" color="#FFFFFF" style={styles.badgeText}>
            {row.badge.text}
          </AppText>
        </View>
      ) : null}
      <Ionicons
        name={isRTL ? 'caret-back-outline' : 'caret-forward-outline'}
        size={20}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText variant="caption" color={colors.mutedForeground}>
        {label}
      </AppText>
    </View>
  );
}

/** Profile tab: wavy blue header with the learner card, quick stats, and the account menu. */
export function ProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const header = useHeaderScroll(width * 0.25);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const unread = useUnreadCount().data ?? 0;
  const [logoutOpen, setLogoutOpen] = useState(false);
  const overview = useProgressOverview();
  const stats = useProgressStats();
  const dashboard = useDashboard();

  const sum = totals(
    buildAchievements(stats.data, overview.data, dashboard.data?.currentStreak ?? 0, t.achievements),
  );

  const rows: Row[] = [
    {
      key: 'settings',
      title: t.profile.settings,
      icon: 'settings-outline',
      color: '#3F86F0',
      href: '/settings',
    },
    {
      key: 'achievements',
      title: t.profile.achievements,
      icon: 'trophy-outline',
      color: '#F2B42D',
      href: '/achievements',
      badge: stats.data ? { text: `${sum.earned}/${sum.max} ★`, color: '#4C6EF5' } : undefined,
    },
    {
      key: 'progress',
      title: t.profile.progress,
      icon: 'stats-chart-outline',
      color: '#2E8B57',
      href: '/progress',
    },
    {
      key: 'notifications',
      title: t.profile.notifications,
      icon: 'notifications-outline',
      color: '#F2703D',
      href: '/settings/notifications',
      badge: unread > 0 ? { text: t.profile.newCount(unread), color: '#F2703D' } : undefined,
    },
  ];

  const confirmLogout = () => setLogoutOpen(true);

  const level = profile?.learningLevel;

  return (
    <View style={styles.root}>
      <FocusedLightStatusBar dark={header.gone} />
      <ScrollView
        ref={header.ref}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={header.onScroll}
        scrollEventThrottle={header.scrollEventThrottle}
      >
        {/* Inside the scroll content, so the blue header scrolls away with it. */}
        <WaveBackdrop variant="rise" />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.topSide} />
            <AppText style={styles.topTitle} color="#FFFFFF" accessibilityRole="header">
              {t.profile.title}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.profile.settings}
              onPress={() => router.push('/settings')}
              hitSlop={8}
              style={styles.squareBtn}
            >
              <Ionicons name="settings-outline" size={24} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.identity}>
            <View style={styles.avatarWrap}>
              <Avatar
                name={profile?.displayName}
                email={profile?.email}
                url={profile?.avatarUrl}
                size={92}
              />
            </View>
            <View style={styles.identityText}>
              <AppText style={styles.name} numberOfLines={1}>
                {profile?.displayName}
              </AppText>
              <AppText color={colors.mutedForeground} numberOfLines={1}>
                {profile?.email}
              </AppText>
              <AppText variant="small" color={colors.primaryDark} style={styles.level}>
                {level ? t.profile.levelLabel(level) : t.profile.newHere}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.profile.editProfile}
              onPress={() => router.push('/settings/account')}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Ionicons name="create-outline" size={24} color={colors.ink} />
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={styles.statsRow}>
          <Stat
            value={overview.data ? String(overview.data.totalLearned) : '–'}
            label={t.profile.learned}
          />
          <View style={styles.divider} />
          <Stat value={stats.data ? `${sum.earned}` : '–'} label={t.profile.stars} />
          <View style={styles.divider} />
          <Stat value={profile?.preferredLanguage ?? 'EN'} label={t.profile.explanationLanguage} />
        </View>

        <View style={styles.card}>
          <AppText variant="small" color={colors.mutedForeground}>
            {t.profile.overview}
          </AppText>
          {rows.map((r) => (
            <MenuRow key={r.key} row={r} onPress={() => router.push(r.href)} />
          ))}
        </View>

        <View style={styles.card}>
          <AppText variant="small" color={colors.mutedForeground}>
            {t.profile.myAccount}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.profile.accountAndPassword}
            onPress={() => router.push('/settings/account')}
            style={styles.link}
          >
            <AppText variant="subheading" color="#3F51B5">
              {t.profile.accountAndPassword}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.profile.logout}
            onPress={confirmLogout}
            style={styles.link}
          >
            <AppText variant="subheading" color="#E5654F">
              {t.profile.logout}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
      <ConfirmSheet
        visible={logoutOpen}
        destructive
        title={t.profile.logoutTitle}
        message={t.profile.logoutMessage}
        confirmLabel={t.profile.logout}
        onConfirm={() => {
          setLogoutOpen(false);
          void signOut();
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  scroll: { paddingBottom: spacing.xxl, gap: spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  topSide: { width: MIN_TOUCH },
  topTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  squareBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D2433',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  avatarWrap: {
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#1D2433',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  // flex-start is the start edge of the reading direction: right in Persian, left in English.
  identityText: { flex: 1, gap: 2, alignItems: 'flex-start' },
  name: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.ink },
  level: { fontWeight: '700' },
  editBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.ink },
  divider: { width: 1, height: 36, backgroundColor: colors.border },
  card: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '600', color: colors.ink },
  badge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontWeight: '700' },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center' },
});
