import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, FocusedLightStatusBar, WaveBackdrop } from '@/components/ui';
import { totals, buildAchievements } from '@/features/achievements/model';
import { useDashboard } from '@/features/dashboard/hooks';
import { useUnreadCount } from '@/features/notifications/hooks';
import { useProgressOverview, useProgressStats } from '@/features/progress/hooks';
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
      <AppText
        style={styles.rowTitle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {row.title}
      </AppText>
      {row.badge ? (
        <View style={[styles.badge, { backgroundColor: row.badge.color }]}>
          <AppText variant="caption" color="#FFFFFF" style={styles.badgeText}>
            {row.badge.text}
          </AppText>
        </View>
      ) : null}
      <Ionicons name="caret-forward-outline" size={20} color={colors.mutedForeground} />
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
  const { width } = useWindowDimensions();
  // Status-bar icons are light on the blue header and must turn dark once it has scrolled away.
  const [headerGone, setHeaderGone] = useState(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const gone = e.nativeEvent.contentOffset.y > width * 0.25;
    setHeaderGone((prev) => (prev === gone ? prev : gone));
  };
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const unread = useUnreadCount().data ?? 0;
  const overview = useProgressOverview();
  const stats = useProgressStats();
  const dashboard = useDashboard();

  const sum = totals(
    buildAchievements(stats.data, overview.data, dashboard.data?.currentStreak ?? 0),
  );

  const rows: Row[] = [
    {
      key: 'settings',
      title: 'Einstellungen',
      icon: 'settings-outline',
      color: '#3F86F0',
      href: '/settings',
    },
    {
      key: 'achievements',
      title: 'Erfolge',
      icon: 'trophy-outline',
      color: '#F2B42D',
      href: '/achievements',
      badge: stats.data ? { text: `${sum.earned}/${sum.max} ★`, color: '#4C6EF5' } : undefined,
    },
    {
      key: 'progress',
      title: 'Fortschritt',
      icon: 'stats-chart-outline',
      color: '#2E8B57',
      href: '/progress',
    },
    {
      key: 'notifications',
      title: 'Benachrichtigungen',
      icon: 'notifications-outline',
      color: '#F2703D',
      href: '/settings/notifications',
      badge: unread > 0 ? { text: `${unread} neu`, color: '#F2703D' } : undefined,
    },
  ];

  const confirmLogout = () =>
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: () => void signOut() },
    ]);

  const level = profile?.learningLevel;

  return (
    <View style={styles.root}>
      <FocusedLightStatusBar dark={headerGone} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {/* Inside the scroll content, so the blue header scrolls away with it. */}
        <WaveBackdrop variant="rise" />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.topSide} />
            <AppText style={styles.topTitle} color="#FFFFFF" accessibilityRole="header">
              Mein Profil
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Einstellungen"
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
                {level ? `Niveau ${level}` : 'Neu dabei'}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profil bearbeiten"
              onPress={() => router.push('/settings/account')}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Ionicons name="create-outline" size={24} color={colors.ink} />
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={styles.statsRow}>
          <Stat value={overview.data ? String(overview.data.totalLearned) : '–'} label="Gelernt" />
          <View style={styles.divider} />
          <Stat value={stats.data ? `${sum.earned}` : '–'} label="Sterne" />
          <View style={styles.divider} />
          <Stat value={profile?.preferredLanguage ?? 'EN'} label="Erklärsprache" />
        </View>

        <View style={styles.card}>
          <AppText variant="small" color={colors.mutedForeground}>
            Übersicht
          </AppText>
          {rows.map((r) => (
            <MenuRow key={r.key} row={r} onPress={() => router.push(r.href)} />
          ))}
        </View>

        <View style={styles.card}>
          <AppText variant="small" color={colors.mutedForeground}>
            Mein Konto
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Konto und Passwort"
            onPress={() => router.push('/settings/account')}
            style={styles.link}
          >
            <AppText variant="subheading" color="#3F51B5">
              Konto & Passwort
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abmelden"
            onPress={confirmLogout}
            style={styles.link}
          >
            <AppText variant="subheading" color="#E5654F">
              Abmelden
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
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
  identityText: { flex: 1, gap: 2 },
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
