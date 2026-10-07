import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Chip, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import type { WritingLearningResponse } from '@/types/writing';
import { IconButton, tint } from '../components/kit';
import { LearnPath } from './learn/LearnPath';
import { LessonPlayer } from './learn/LessonPlayer';
import { buildStations } from './learn/stations';
import { WRITING_COLOR } from './learn/ui';
import { useLearnProgress } from './learn/useLearnProgress';
import { useWritingLearning } from './hooks';
import type { LearnSectionId } from './writingMeta';
import { darken } from '@/features/exam/components/kit';
import { HeroBackdrop } from '@/components/ui/HeroDecor';
import { SectionIcon } from '@/features/exam/components/SectionIcon';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

/** Path overview or one lesson. Keyed by level so progress state never leaks between levels. */
function LearnView({
  level,
  data,
  onLevel,
}: {
  level: string;
  data: WritingLearningResponse;
  onLevel: (l: string) => void;
}) {
  const router = useRouter();
  const stations = useMemo(() => buildStations(data, level), [data, level]);
  const { done, markDone, reset } = useLearnProgress(level);
  const [stationId, setStationId] = useState<LearnSectionId | null>(null);

  const current = stationId ? stations.find((s) => s.id === stationId) : undefined;
  if (current) {
    const idx = stations.findIndex((s) => s.id === current.id);
    const nextId = stations[idx + 1]?.id ?? null;
    return (
      <LessonPlayer
        key={current.id}
        station={current}
        nextStationId={nextId}
        onFinished={markDone}
        onNext={(id) => (id ? setStationId(id) : router.back())}
        onExit={() => setStationId(null)}
      />
    );
  }

  return (
    <OverviewShell level={level} onLevel={onLevel}>
      {stations.length === 0 ? (
        <EmptyState
          emoji="📚"
          title="Noch keine Lerninhalte"
          message={`Für ${level} sind noch keine Lerninhalte verfügbar.`}
        />
      ) : (
        <LearnPath
          stations={stations}
          done={done}
          onOpen={setStationId}
          onReset={reset}
          onPractice={() => router.back()}
        />
      )}
    </OverviewShell>
  );
}

/** Tinted header (back, title, level) over the scrolling content, like the Teil page. */
function OverviewShell({
  level,
  onLevel,
  children,
}: {
  level: string;
  onLevel: (l: string) => void;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: tint(WRITING_COLOR, '1F') }]}>
          <HeroBackdrop color={WRITING_COLOR} />
          <SafeAreaView edges={['top']}>
            <View style={styles.topRow}>
              <IconButton name="arrow-back" label="Zurück" onPress={() => router.back()} />
              <View
                style={[styles.tag, styles.tagRow, { backgroundColor: tint(WRITING_COLOR, '33') }]}
              >
                <SectionIcon section="SCHRIFTLICHER_AUSDRUCK" size={14} />
                <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                  SCHREIBEN · {level}
                </AppText>
              </View>
            </View>
            <AppText style={styles.title} accessibilityRole="header">
              Schreiben lernen
            </AppText>
            <AppText color={colors.ink}>
              Kleine Schritte, Aufgaben zum Ausprobieren – und du siehst sofort, was du schon
              kannst.
            </AppText>
          </SafeAreaView>
        </View>
        <View style={styles.body}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.levels}
          >
            {LEVELS.map((l) => (
              <Chip
                key={l}
                label={l}
                selected={l === level}
                onPress={() => onLevel(l)}
                color={darken(WRITING_COLOR)}
              />
            ))}
          </ScrollView>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export function WritingLearnScreen() {
  const params = useLocalSearchParams<{ level?: string }>();
  const profileLevel = useAuthStore((s) => s.profile?.learningLevel);
  const initial = params.level || (profileLevel && profileLevel !== 'null' ? profileLevel : 'B1');
  const [level, setLevel] = useState(initial);
  const query = useWritingLearning(level, true);

  let body;
  if (query.isPending) {
    body = (
      <OverviewShell level={level} onLevel={setLevel}>
        <View accessibilityLabel="Lerninhalte werden geladen" style={{ gap: spacing.md }}>
          <Skeleton height={110} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </View>
      </OverviewShell>
    );
  } else if (query.isError) {
    body = (
      <OverviewShell level={level} onLevel={setLevel}>
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </OverviewShell>
    );
  } else {
    body = <LearnView key={level} level={level} data={query.data} onLevel={setLevel} />;
  }

  return <View style={styles.root}>{body}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  hero: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -spacing.sm,
  },
  tag: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: colors.ink },
  body: { padding: spacing.lg, gap: spacing.lg },
  levels: { gap: spacing.sm },
});
