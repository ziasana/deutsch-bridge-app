import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  Header,
  ProgressBar,
  ProgressRing,
  Screen,
  Skeleton,
} from '@/components/ui';
import { useDashboard } from '@/features/dashboard/hooks';
import { weekDays } from '@/features/dashboard/viewModel';
import { IconButton, PressableScale, tint } from '@/features/exam/components/kit';
import { colors, radius, spacing } from '@/theme';
import type { CategoryProgress, ProgressOverview, ProgressStats } from '@/types/progress';
import { useProgressOverview, useProgressStats } from './hooks';
import {
  expressionSegments,
  nextMilestoneText,
  percent,
  vocabularySegments,
  type BarSegment,
} from './segments';

const NEUTRAL = '#D5DBE6';
const CHART = { learning: '#4C8DFF', familiar: '#F2A93B', active: '#8B5CF6', mastered: '#2DB37A' };
const GREEN = '#27AE7A';
const GOLD = '#E8A21A';

// ---- hero ----

function Hero({
  overview,
  streak,
  level,
}: {
  overview: ProgressOverview;
  streak: number | undefined;
  level: string | undefined;
}) {
  const router = useRouter();
  const overall = percent(overview.totalLearned, overview.totalAvailable);
  return (
    <View style={[styles.hero, { backgroundColor: tint(GREEN, '1F') }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topRow}>
          <IconButton name="arrow-back" label="Zurück" onPress={() => router.back()} />
          <View style={[styles.chip, { backgroundColor: tint(GREEN, '33') }]}>
            <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
              📈 DEIN FORTSCHRITT
            </AppText>
          </View>
        </View>
        <View style={styles.heroMain}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="caption" color="#1B7A55" style={{ fontWeight: '800' }}>
              INSGESAMT GELERNT
            </AppText>
            <AppText style={styles.big} accessibilityRole="header">
              {overview.totalLearned}
              <AppText style={styles.bigSub} color={colors.mutedForeground}>
                {' '}
                / {overview.totalAvailable}
              </AppText>
            </AppText>
            <View style={styles.chips}>
              {streak != null && streak > 0 ? (
                <View style={styles.pill}>
                  <Ionicons name="flame" size={14} color="#F5762B" />
                  <AppText variant="caption" style={{ fontWeight: '800' }} color={colors.ink}>
                    {streak} {streak === 1 ? 'Tag' : 'Tage'}
                  </AppText>
                </View>
              ) : null}
              {level ? (
                <View style={styles.pill}>
                  <AppText
                    variant="caption"
                    style={{ fontWeight: '800' }}
                    color={colors.primaryDark}
                  >
                    {level}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
          <ProgressRing
            value={overall}
            size={92}
            stroke={10}
            color={GREEN}
            textSize={22}
            trackColor="#FFFFFFCC"
            label="Gesamtfortschritt"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ---- daily goal + week ----

function DailyGoalCard({
  overview,
  days,
}: {
  overview: ProgressOverview;
  days: { label: string; learned: boolean; isToday: boolean }[] | undefined;
}) {
  const goal = overview.dailyGoalWords;
  const pct = goal ? percent(overview.itemsLearnedToday, goal) : 0;
  const learnedDays = days?.filter((d) => d.learned).length ?? 0;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <ProgressRing
          value={pct}
          size={84}
          stroke={9}
          color={colors.primary}
          textSize={18}
          label="Tagesziel"
        />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={styles.cardTitle}>Tagesziel</AppText>
          {goal ? (
            <AppText color={colors.mutedForeground}>
              Heute: {overview.itemsLearnedToday} / {goal} Lernziele
            </AppText>
          ) : (
            <AppText color={colors.mutedForeground}>Du hast noch kein Tagesziel gesetzt.</AppText>
          )}
        </View>
      </View>
      {days ? (
        <View style={{ gap: spacing.sm }}>
          <View
            accessible
            accessibilityLabel={`${learnedDays} von ${days.length} Tagen gelernt`}
            style={styles.week}
          >
            {days.map((d, i) => (
              <View key={i} style={styles.dayCol}>
                <AppText
                  variant="caption"
                  color={d.isToday ? colors.primaryDark : colors.mutedForeground}
                  style={d.isToday ? { fontWeight: '800' } : undefined}
                >
                  {d.label}
                </AppText>
                <View
                  style={[
                    styles.dayDot,
                    d.learned && { backgroundColor: GREEN, borderColor: GREEN },
                    d.isToday && !d.learned && { borderColor: colors.primary },
                  ]}
                >
                  {d.learned ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
                </View>
              </View>
            ))}
          </View>
          <AppText variant="small" color={colors.mutedForeground} center>
            {learnedDays} von {days.length} Tagen gelernt
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

// ---- area tiles ----

type Area = {
  key: string;
  emoji: string;
  title: string;
  color: string;
  progress: CategoryProgress;
  href: string;
};

/** A colour-coded tile per learning area: ring, title, x / y. Tap to go and learn there. */
function AreaTile({ area, onPress }: { area: Area; onPress: () => void }) {
  const pct = percent(area.progress.learned, area.progress.total);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${area.title}: ${area.progress.learned} von ${area.progress.total}, ${pct} Prozent`}
      onPress={onPress}
      containerStyle={styles.tileWrap}
      style={[
        styles.tile,
        { backgroundColor: tint(area.color, '14'), borderColor: tint(area.color, '33') },
      ]}
    >
      <View style={styles.tileTop}>
        <AppText style={{ fontSize: 24, lineHeight: 30 }}>{area.emoji}</AppText>
        <ProgressRing
          value={pct}
          size={46}
          stroke={5}
          textSize={11}
          color={area.color}
          trackColor="#FFFFFFCC"
          label={`${area.title} Fortschritt`}
        />
      </View>
      <AppText variant="small" style={{ fontWeight: '700' }} color={colors.ink} numberOfLines={2}>
        {area.title}
      </AppText>
      <AppText style={styles.tileValue}>
        {area.progress.learned} / {area.progress.total}
      </AppText>
    </PressableScale>
  );
}

// ---- mastery ----

function StackedBar({
  segments,
  label,
  focus,
}: {
  segments: BarSegment[];
  label: string;
  focus: string | null;
}) {
  const total = segments.reduce((n, s) => n + s.count, 0);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label}: ${segments.map((s) => `${s.label} ${s.count}`).join(', ')}`}
      style={styles.stack}
    >
      {segments
        .filter((s) => s.count > 0)
        .map((s) => (
          <View
            key={s.key}
            style={{
              flex: s.count / (total || 1),
              backgroundColor: s.color,
              opacity: focus && focus !== s.key ? 0.3 : 1,
            }}
          />
        ))}
    </View>
  );
}

/** Mastery split as one bar; tap a legend chip to spotlight that step and see its share. */
function MasteryCard({
  title,
  total,
  segments,
  emptyMessage,
  ctaLabel,
  onCta,
}: {
  title: string;
  total: number;
  segments: BarSegment[];
  emptyMessage: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  const [focus, setFocus] = useState<string | null>(null);
  const picked = segments.find((s) => s.key === focus);
  return (
    <View style={styles.card}>
      <View style={styles.between}>
        <AppText style={styles.cardTitle}>{title}</AppText>
        <View style={styles.count}>
          <AppText variant="small" style={{ fontWeight: '800' }} color={colors.mutedForeground}>
            {total}
          </AppText>
        </View>
      </View>
      {total === 0 ? (
        <>
          <AppText color={colors.mutedForeground}>{emptyMessage}</AppText>
          <Button pill label={ctaLabel} variant="secondary" onPress={onCta} />
        </>
      ) : (
        <>
          <StackedBar segments={segments} label={title} focus={focus} />
          <View style={styles.legend}>
            {segments.map((s) => {
              const on = focus === s.key;
              return (
                <Pressable
                  key={s.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.label} · ${s.count}`}
                  accessibilityState={{ selected: on }}
                  onPress={() => setFocus(on ? null : s.key)}
                  style={[
                    styles.legendItem,
                    on && { backgroundColor: tint(s.color, '33'), borderColor: s.color },
                  ]}
                >
                  <View style={[styles.swatch, { backgroundColor: s.color }]} />
                  <AppText variant="small" style={{ fontWeight: on ? '800' : '500' }}>
                    {s.label} · {s.count}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {picked ? (
            <AppText variant="small" color={colors.ink} style={{ fontWeight: '700' }}>
              {picked.label}: {percent(picked.count, total)}% deiner {total} Einträge
            </AppText>
          ) : null}
        </>
      )}
    </View>
  );
}

// ---- panels ----

function Panel({
  icon,
  color,
  title,
  cta,
  onCta,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  cta: string;
  onCta: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.panelIcon, { backgroundColor: tint(color, '1F') }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <AppText style={[styles.cardTitle, { flex: 1 }]}>{title}</AppText>
      </View>
      {children}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cta}
        onPress={onCta}
        style={styles.linkRow}
      >
        <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '800' }}>
          {cta}
        </AppText>
        <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

function LabeledBar({
  label,
  learned,
  total,
  color,
}: {
  label: string;
  learned: number;
  total: number;
  color: string;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={styles.between}>
        <AppText variant="small" style={{ fontWeight: '600' }}>
          {label}
        </AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {learned} / {total}
        </AppText>
      </View>
      <ProgressBar value={percent(learned, total)} label={label} color={color} />
    </View>
  );
}

// ---- milestones ----

function PulseRing({ color }: { color: string }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
      }}
    />
  );
}

/** The vocabulary milestones as a path: reached steps are filled, the next one pulses, the rest are outlined. */
function Milestones({ stats }: { stats: ProgressStats }) {
  const m = stats.milestones;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.panelIcon, { backgroundColor: tint(GOLD, '1F') }]}>
          <Ionicons name="trophy" size={22} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={styles.cardTitle}>🏅 Meilensteine</AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {nextMilestoneText(m)}
          </AppText>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ladder}
      >
        {m.thresholds.map((t, i) => {
          const reached = m.reached[i];
          const next = !reached && t === m.nextThreshold;
          const last = i === m.thresholds.length - 1;
          return (
            <View key={t} style={styles.step}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View
                  accessible
                  accessibilityLabel={`${t} Wörter${reached ? ', erreicht' : ''}`}
                  style={[
                    styles.node,
                    reached && { backgroundColor: GOLD, borderColor: GOLD },
                    next && { borderColor: GOLD, backgroundColor: tint(GOLD, '1F') },
                  ]}
                >
                  {next ? <PulseRing color={GOLD} /> : null}
                  {reached ? (
                    <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                  ) : (
                    <AppText
                      variant="caption"
                      style={{ fontWeight: '800' }}
                      color={next ? '#8A5A00' : colors.mutedForeground}
                    >
                      {t}
                    </AppText>
                  )}
                </View>
                <AppText variant="caption" color={reached ? colors.ink : colors.mutedForeground}>
                  {t}
                </AppText>
              </View>
              {!last ? (
                <View style={[styles.stepLine, reached && { backgroundColor: GOLD }]} />
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function ProgressScreen() {
  const router = useRouter();
  const overview = useProgressOverview();
  const stats = useProgressStats();
  const dashboard = useDashboard();

  if (overview.isPending || stats.isPending) {
    return (
      <Screen>
        <Header title="Progress" subtitle="Dein Lernfortschritt" back />
        <View accessibilityLabel="Fortschritt wird geladen" style={{ gap: spacing.md }}>
          <Skeleton height={140} />
          <Skeleton height={180} />
          <Skeleton height={120} />
        </View>
      </Screen>
    );
  }
  if (overview.isError || stats.isError) {
    return (
      <Screen>
        <Header title="Progress" subtitle="Dein Lernfortschritt" back />
        <ErrorState
          error={overview.error ?? stats.error}
          onRetry={() => {
            void overview.refetch();
            void stats.refetch();
          }}
        />
      </Screen>
    );
  }

  const o = overview.data;
  const s = stats.data;
  if (o.totalAvailable === 0 && o.totalLearned === 0 && s.vocabulary.total === 0) {
    return (
      <Screen>
        <Header title="Progress" subtitle="Dein Lernfortschritt" back />
        <EmptyState
          emoji="🌱"
          title="Noch kein Fortschritt"
          message="Lerne dein erstes Wort – dann erscheint hier dein Fortschritt."
          actionLabel="Jetzt lernen"
          onAction={() => router.push('/learn')}
        />
      </Screen>
    );
  }

  const exam = s.examPerformance;
  const week = dashboard.data ? weekDays(dashboard.data.week.days, new Date()) : undefined;
  const areas: Area[] = [
    {
      key: 'mastered',
      emoji: '🏆',
      title: 'Wörter gemeistert',
      color: GOLD,
      progress: { learned: o.totalLearned, total: o.totalAvailable },
      href: '/learn/vocabulary',
    },
    {
      key: 'daily',
      emoji: '🌱',
      title: 'Daily Words',
      color: '#F59E0B',
      progress: o.dailyWords,
      href: '/learn/daily-words',
    },
    {
      key: 'grammar',
      emoji: '🧩',
      title: 'Grammatik-Lektionen',
      color: '#E8892B',
      progress: o.grammar,
      href: '/learn/grammar',
    },
    {
      key: 'expr',
      emoji: '💬',
      title: 'Active Expressions',
      color: GREEN,
      progress: o.expressions,
      href: '/learn/expressions',
    },
    {
      key: 'reading',
      emoji: '📖',
      title: 'Reading',
      color: '#8B5CF6',
      progress: o.reading,
      href: '/learn/reading',
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Hero
          overview={o}
          streak={dashboard.data?.currentStreak}
          level={dashboard.data?.user.learningLevel}
        />
        <View style={styles.body}>
          <DailyGoalCard overview={o} days={week} />

          <View style={{ gap: spacing.sm }}>
            <AppText style={styles.sectionTitle} accessibilityRole="header">
              Deine Lernbereiche
            </AppText>
            <View style={styles.tiles}>
              {areas.map((a) => (
                <AreaTile key={a.key} area={a} onPress={() => router.push(a.href as never)} />
              ))}
            </View>
          </View>

          <MasteryCard
            title="📚 Wortschatz"
            total={s.vocabulary.total}
            segments={vocabularySegments(s.vocabulary, { new: NEUTRAL, ...CHART })}
            emptyMessage="Du hast noch keine Wörter im Vokabular."
            ctaLabel="Vokabeln üben"
            onCta={() => router.push('/learn/review')}
          />
          <MasteryCard
            title="💬 Ausdrücke"
            total={s.expressions.total}
            segments={expressionSegments(s.expressions, { new: NEUTRAL, ...CHART })}
            emptyMessage="Du hast noch keine Ausdrücke gelernt."
            ctaLabel="Ausdrücke üben"
            onCta={() => router.push('/learn/expressions')}
          />

          <Panel
            icon="school"
            color="#E8892B"
            title="Grammatik"
            cta="Grammatik üben"
            onCta={() => router.push('/learn/grammar')}
          >
            <LabeledBar
              label="Lektionen"
              learned={s.grammar.lessonsLearned}
              total={s.grammar.lessonsTotal}
              color="#E8892B"
            />
            <LabeledBar
              label="Kategorie-Tests bestanden"
              learned={s.grammar.categoriesPassed}
              total={s.grammar.categoriesTotal}
              color={GREEN}
            />
            <AppText variant="small" color={colors.mutedForeground}>
              Lektionen: {s.grammar.lessonsLearned} / {s.grammar.lessonsTotal}
            </AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              Kategorie-Tests bestanden: {s.grammar.categoriesPassed} / {s.grammar.categoriesTotal}
              {s.grammar.categoriesAttempted > 0
                ? ` (${s.grammar.categoriesAttempted} versucht)`
                : ''}
            </AppText>
          </Panel>

          <Panel
            icon="ribbon"
            color="#EC3E4E"
            title="Prüfungen"
            cta={exam.attemptsCompleted > 0 ? 'Weiter üben' : 'Prüfungsvorbereitung starten'}
            onCta={() => router.push('/exam')}
          >
            {exam.attemptsCompleted > 0 && exam.averageScore != null ? (
              <View style={styles.head}>
                <ProgressRing
                  value={exam.averageScore}
                  size={72}
                  stroke={8}
                  textSize={16}
                  color="#6366F1"
                  label="Durchschnittliche Punktzahl"
                />
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '700' }}>
                    Durchschnitt: {Math.round(exam.averageScore)}% · {exam.attemptsCompleted}{' '}
                    {exam.attemptsCompleted === 1 ? 'Versuch' : 'Versuche'}
                  </AppText>
                </View>
              </View>
            ) : (
              <AppText color={colors.mutedForeground}>
                Noch keine abgeschlossene Prüfungsübung.
              </AppText>
            )}
          </Panel>

          <Milestones stats={s} />
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
    paddingRight: spacing.sm,
  },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.md },
  big: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  bigSub: { fontSize: 22, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFFCC',
  },
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  cardTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  count: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tileWrap: { width: '47.5%', flexGrow: 1 },
  tile: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5 },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileValue: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  stack: {
    flexDirection: 'row',
    height: 16,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  panelIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 36,
  },
  ladder: { paddingVertical: spacing.sm, paddingRight: spacing.lg },
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  node: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 28,
    height: 4,
    borderRadius: 2,
    marginTop: 20,
    marginHorizontal: 4,
    backgroundColor: colors.border,
  },
});
