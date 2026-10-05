import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, EmptyState, ErrorState, Header, ProgressBar, Screen, Skeleton } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/hooks';
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

function StackedBar({ segments, label }: { segments: BarSegment[]; label: string }) {
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
          <View key={s.key} style={{ flex: s.count / (total || 1), backgroundColor: s.color }} />
        ))}
    </View>
  );
}

function Legend({ segments }: { segments: BarSegment[] }) {
  return (
    <View style={styles.legend}>
      {segments.map((s) => (
        <View key={s.key} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: s.color }]} />
          <AppText variant="small">
            {s.label} · {s.count}
          </AppText>
        </View>
      ))}
    </View>
  );
}

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
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.between}>
        <AppText variant="subheading">{title}</AppText>
        <AppText color={colors.mutedForeground}>{total}</AppText>
      </View>
      {total === 0 ? (
        <>
          <AppText color={colors.mutedForeground}>{emptyMessage}</AppText>
          <Button label={ctaLabel} variant="secondary" onPress={onCta} />
        </>
      ) : (
        <>
          <StackedBar segments={segments} label={title} />
          <Legend segments={segments} />
        </>
      )}
    </Card>
  );
}

function Tile({ emoji, title, progress }: { emoji: string; title: string; progress: CategoryProgress }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={styles.between}>
        <AppText>
          {emoji} {title}
        </AppText>
        <AppText color={colors.mutedForeground}>
          {progress.learned} / {progress.total}
        </AppText>
      </View>
      <ProgressBar value={percent(progress.learned, progress.total)} label={`${title} Fortschritt`} />
    </View>
  );
}

function Hero({ overview, streak }: { overview: ProgressOverview; streak: number | undefined }) {
  const overall = percent(overview.totalLearned, overview.totalAvailable);
  const goal = overview.dailyGoalWords;
  return (
    <Card tone="accent" style={{ gap: spacing.md }}>
      <View style={styles.between}>
        <View>
          <AppText variant="caption" color={colors.primaryDark}>
            INSGESAMT GELERNT
          </AppText>
          <AppText style={styles.big}>
            {overview.totalLearned}
            <AppText color={colors.mutedForeground}> / {overview.totalAvailable}</AppText>
          </AppText>
        </View>
        {streak != null ? (
          <View style={{ alignItems: 'center' }} accessibilityLabel={`Serie: ${streak} Tage`}>
            <AppText style={{ fontSize: 28 }}>🔥</AppText>
            <AppText variant="subheading">{streak} {streak === 1 ? 'Tag' : 'Tage'}</AppText>
          </View>
        ) : null}
      </View>
      <ProgressBar value={overall} label="Gesamtfortschritt" />
      {goal ? (
        <AppText color={colors.mutedForeground}>
          Heute: {overview.itemsLearnedToday} / {goal} Lernziele
        </AppText>
      ) : null}
    </Card>
  );
}

function Milestones({ stats }: { stats: ProgressStats }) {
  const m = stats.milestones;
  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="subheading">🏅 Meilensteine</AppText>
      <AppText color={colors.mutedForeground}>{nextMilestoneText(m)}</AppText>
      <View style={styles.legend}>
        {m.thresholds.map((t, i) => (
          <View
            key={t}
            accessibilityLabel={`${t} Wörter${m.reached[i] ? ', erreicht' : ''}`}
            style={[styles.milestone, m.reached[i] && styles.milestoneDone]}
          >
            <AppText variant="small" color={m.reached[i] ? colors.primaryForeground : colors.mutedForeground}>
              {m.reached[i] ? '✓ ' : ''}
              {t}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
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
        <EmptyState emoji="🌱" title="Noch kein Fortschritt" message="Lerne dein erstes Wort – dann erscheint hier dein Fortschritt." actionLabel="Jetzt lernen" onAction={() => router.push('/learn')} />
      </Screen>
    );
  }

  const exam = s.examPerformance;
  return (
    <Screen>
      <Header title="Progress" subtitle="Dein Lernfortschritt" back />
      <Hero overview={o} streak={dashboard.data?.currentStreak} />

      <Card style={{ gap: spacing.lg }}>
        <Tile emoji="🏆" title="Wörter gemeistert" progress={{ learned: o.totalLearned, total: o.totalAvailable }} />
        <Tile emoji="🌱" title="Daily Words" progress={o.dailyWords} />
        <Tile emoji="🧩" title="Grammatik-Lektionen" progress={o.grammar} />
        <Tile emoji="💬" title="Active Expressions" progress={o.expressions} />
        <Tile emoji="📖" title="Reading" progress={o.reading} />
      </Card>

      <MasteryCard
        title="📚 Wortschatz"
        total={s.vocabulary.total}
        segments={vocabularySegments(s.vocabulary, { new: NEUTRAL, ...CHART })}
        emptyMessage="Du hast noch keine Wörter im Vokabular."
        ctaLabel="Vokabeln üben"
        onCta={() => router.push('/learn/vocabulary')}
      />
      <MasteryCard
        title="💬 Ausdrücke"
        total={s.expressions.total}
        segments={expressionSegments(s.expressions, { new: NEUTRAL, ...CHART })}
        emptyMessage="Du hast noch keine Ausdrücke gelernt."
        ctaLabel="Ausdrücke üben"
        onCta={() => router.push('/learn/expressions')}
      />

      <Card style={{ gap: spacing.sm }}>
        <AppText variant="subheading">🧩 Grammatik</AppText>
        <AppText>
          Lektionen: {s.grammar.lessonsLearned} / {s.grammar.lessonsTotal}
        </AppText>
        <AppText>
          Kategorie-Tests bestanden: {s.grammar.categoriesPassed} / {s.grammar.categoriesTotal}
          {s.grammar.categoriesAttempted > 0 ? ` (${s.grammar.categoriesAttempted} versucht)` : ''}
        </AppText>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <AppText variant="subheading">🎯 Prüfungen</AppText>
        {exam.attemptsCompleted > 0 && exam.averageScore != null ? (
          <AppText>
            Durchschnitt: {Math.round(exam.averageScore)}% · {exam.attemptsCompleted}{' '}
            {exam.attemptsCompleted === 1 ? 'Versuch' : 'Versuche'}
          </AppText>
        ) : (
          <AppText color={colors.mutedForeground}>Noch keine abgeschlossene Prüfungsübung.</AppText>
        )}
      </Card>

      <Milestones stats={s} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  big: { fontSize: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stack: { flexDirection: 'row', height: 14, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.muted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginRight: spacing.sm },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  milestone: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.muted },
  milestoneDone: { backgroundColor: colors.primary },
});
