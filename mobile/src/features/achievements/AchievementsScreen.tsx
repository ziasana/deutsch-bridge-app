import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { AppText, Card, ErrorState, Header, ProgressRing, Screen, Skeleton } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/hooks';
import { useProgressOverview, useProgressStats } from '@/features/progress/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import { MAX_STARS, buildAchievements, totals, type Achievement } from './model';

function Stars({ count, onDark }: { count: number; onDark?: boolean }) {
  return (
    <View accessible accessibilityLabel={`${count} von ${MAX_STARS} Sternen`} style={styles.stars}>
      {Array.from({ length: MAX_STARS }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={20}
          color={i < count ? '#FF9F2E' : onDark ? 'rgba(255,255,255,0.85)' : colors.border}
        />
      ))}
    </View>
  );
}

function AchievementCard({ item }: { item: Achievement }) {
  return (
    <View style={[styles.card, { backgroundColor: item.color }]}>
      <View style={styles.medal}>
        <AppText style={styles.medalEmoji}>{item.emoji}</AppText>
      </View>
      <View style={styles.cardBody}>
        <Stars count={item.stars} onDark />
        <AppText style={styles.cardTitle} color="#FFFFFF">
          {item.title}
        </AppText>
        <AppText style={styles.cardText} color="#FFFFFF">
          {item.description}
        </AppText>
      </View>
    </View>
  );
}

/** Stars collected across vocabulary, grammar, reading, exams and the learning streak. */
export function AchievementsScreen() {
  const name = useAuthStore((s) => s.profile?.displayName);
  const stats = useProgressStats();
  const overview = useProgressOverview();
  const dashboard = useDashboard();
  const pending = stats.isPending || overview.isPending;
  const refresh = () => {
    void stats.refetch();
    void overview.refetch();
    void dashboard.refetch();
  };

  const items = buildAchievements(stats.data, overview.data, dashboard.data?.currentStreak ?? 0);
  const sum = totals(items);

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={stats.isRefetching && !pending} onRefresh={refresh} />
      }
    >
      <Header title="Erfolge" subtitle="Sammle Sterne beim Lernen" back />
      {pending ? (
        <>
          <Skeleton height={130} />
          <Skeleton height={110} />
          <Skeleton height={110} />
        </>
      ) : stats.isError && !stats.data ? (
        <ErrorState error={stats.error} onRetry={refresh} />
      ) : (
        <>
          <Card style={styles.summary}>
            <ProgressRing value={sum.percent} label="Gesamtfortschritt der Erfolge" />
            <View style={styles.summaryText}>
              <AppText style={styles.summaryTitle}>
                Sterne: {sum.earned}/{sum.max}
              </AppText>
              <AppText color={colors.mutedForeground}>
                {sum.percent >= 100
                  ? 'Alle Sterne gesammelt – unglaublich!'
                  : `${name ? `Tolle Arbeit, ${name.split(' ')[0]}!` : 'Tolle Arbeit!'} Lerne weiter, um mehr Sterne zu sammeln.`}
              </AppText>
            </View>
          </Card>
          {items.map((a) => (
            <AchievementCard key={a.key} item={a} />
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  summaryText: { flex: 1, gap: spacing.xs },
  summaryTitle: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.ink },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  medal: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#F58A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalEmoji: { fontSize: 34, lineHeight: 42 },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  cardText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  stars: { flexDirection: 'row', gap: 2, alignSelf: 'flex-end' },
});
