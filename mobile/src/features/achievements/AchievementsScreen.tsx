import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, ErrorState, ProgressBar, ProgressRing, Skeleton } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/hooks';
import { IconButton, tint } from '@/features/exam/components/kit';
import { useProgressOverview, useProgressStats } from '@/features/progress/hooks';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import { MAX_STARS, buildAchievements, totals, type Achievement } from './model';

const GOLD = '#E8A21A';
const STAR = '#FF9F2E';

function Stars({ count, size = 18 }: { count: number; size?: number }) {
  const { t } = useI18n();
  return (
    <View
      accessible
      accessibilityLabel={t.achievements.starsLabel(count, MAX_STARS)}
      style={styles.stars}
    >
      {Array.from({ length: MAX_STARS }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={size}
          color={i < count ? STAR : colors.border}
        />
      ))}
    </View>
  );
}

/** The achievement's emoji in a round medal; the arc around it shows the progress to five stars. */
function MedalRing({ item, size = 76 }: { item: Achievement; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = item.stars >= MAX_STARS;
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tint(item.color, '33')}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={item.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${(c * Math.min(100, item.progress)) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.medalFace, { backgroundColor: tint(item.color, '1F') }]}>
        <AppText style={styles.medalEmoji}>{item.emoji}</AppText>
      </View>
      {done ? (
        <View style={styles.doneBadge}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

function AchievementCard({ item }: { item: Achievement }) {
  const { t } = useI18n();
  const a = t.achievements;
  const done = item.stars >= MAX_STARS;
  return (
    <View
      style={[styles.card, done && { borderColor: item.color }]}
      accessible
      accessibilityLabel={`${item.title}. ${item.description} ${a.starsLabel(item.stars, MAX_STARS)}`}
    >
      <View style={styles.cardHead}>
        <MedalRing item={item} />
        <View style={styles.cardText}>
          <AppText style={styles.cardTitle}>{item.title}</AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {item.description}
          </AppText>
        </View>
      </View>
      <View style={styles.cardFoot}>
        <View style={styles.starsRow}>
          <Stars count={item.stars} />
          {done ? (
            <View style={[styles.completePill, { backgroundColor: tint(item.color, '33') }]}>
              <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                {a.complete}
              </AppText>
            </View>
          ) : (
            <AppText variant="caption" color={colors.mutedForeground} style={styles.starCount}>
              {item.stars} / {MAX_STARS}
            </AppText>
          )}
        </View>
        <ProgressBar
          value={item.progress}
          color={item.color}
          label={a.progressLabel(item.title, Math.round(item.progress))}
        />
      </View>
    </View>
  );
}

/** One small medal per achievement: dimmed until its first star, starred once it has some. */
function TrophyShelf({ items }: { items: Achievement[] }) {
  const { t } = useI18n();
  return (
    <View style={styles.shelf}>
      {items.map((item) => {
        const earned = item.stars > 0;
        return (
          <View
            key={item.key}
            accessible
            accessibilityLabel={`${item.title}: ${t.achievements.starsLabel(item.stars, MAX_STARS)}`}
            style={styles.shelfItem}
          >
            <View
              style={[
                styles.shelfMedal,
                { backgroundColor: earned ? tint(item.color, '33') : '#FFFFFF99' },
                earned && { borderColor: item.color },
              ]}
            >
              <AppText style={[styles.shelfEmoji, !earned && { opacity: 0.4 }]}>
                {item.emoji}
              </AppText>
            </View>
            <View style={styles.shelfStars}>
              <Ionicons name="star" size={12} color={earned ? STAR : colors.border} />
              <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                {item.stars}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Stars collected across vocabulary, grammar, reading, exams and the learning streak. */
export function AchievementsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const a = t.achievements;
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

  const items = buildAchievements(stats.data, overview.data, dashboard.data?.currentStreak ?? 0, a);
  const sum = totals(items);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={stats.isRefetching && !pending} onRefresh={refresh} />
        }
      >
        <View style={[styles.hero, { backgroundColor: tint(GOLD, '1F') }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.topRow}>
              <IconButton name="arrow-back" label={t.common.back} onPress={() => router.back()} />
              <View style={[styles.chip, { backgroundColor: tint(GOLD, '33') }]}>
                <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                  {a.chip}
                </AppText>
              </View>
            </View>
            <View style={styles.heroMain}>
              <View style={{ flex: 1, gap: 2, alignItems: 'flex-start' }}>
                <AppText variant="caption" color="#8A5A00" style={{ fontWeight: '800' }}>
                  {a.collected}
                </AppText>
                <View style={styles.bigRow}>
                  <Ionicons name="star" size={34} color={STAR} />
                  <AppText style={styles.big} accessibilityRole="header">
                    {sum.earned}
                    <AppText style={styles.bigSub} color={colors.mutedForeground}>
                      {' '}
                      / {sum.max}
                    </AppText>
                  </AppText>
                </View>
                <AppText variant="small" color={colors.ink} style={styles.heroMessage}>
                  {sum.percent >= 100 ? a.allStars : a.keepGoing(name?.split(' ')[0])}
                </AppText>
              </View>
              <ProgressRing
                value={sum.percent}
                size={92}
                stroke={10}
                color={GOLD}
                textSize={22}
                trackColor="#FFFFFFCC"
                label={a.loadingTotal}
              />
            </View>
            {!pending && !(stats.isError && !stats.data) ? <TrophyShelf items={items} /> : null}
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          {pending ? (
            <>
              <Skeleton height={150} />
              <Skeleton height={150} />
              <Skeleton height={150} />
            </>
          ) : stats.isError && !stats.data ? (
            <ErrorState error={stats.error} onRetry={refresh} />
          ) : (
            <>
              <AppText style={styles.sectionTitle} accessibilityRole="header">
                {a.listTitle}
              </AppText>
              {items.map((item) => (
                <AchievementCard key={item.key} item={item} />
              ))}
              <View style={styles.hint}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.mutedForeground}
                />
                <AppText variant="small" color={colors.mutedForeground} style={{ flex: 1 }}>
                  {a.hint}
                </AppText>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.lg },
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
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.md },
  bigRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  big: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  bigSub: { fontSize: 22, fontWeight: '600' },
  heroMessage: { marginTop: spacing.xs },
  shelf: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.lg },
  shelfItem: { alignItems: 'center', gap: 6 },
  shelfMedal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfEmoji: { fontSize: 26, lineHeight: 34 },
  shelfStars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  cardFoot: { gap: spacing.sm },
  starsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stars: { flexDirection: 'row', gap: 2 },
  starCount: { fontVariant: ['tabular-nums'], fontWeight: '700' },
  completePill: { paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radius.pill },
  medalFace: {
    position: 'absolute',
    top: 9,
    start: 9,
    end: 9,
    bottom: 9,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalEmoji: { fontSize: 30, lineHeight: 38 },
  doneBadge: {
    position: 'absolute',
    end: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
});
