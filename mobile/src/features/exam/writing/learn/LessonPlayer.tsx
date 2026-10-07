import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, ProgressBar } from '@/components/ui';
import { AppTextScale } from '@/components/ui/AppText';
import { colors, radius, spacing } from '@/theme';
import { ExerciseFrame, IconButton, TextSizeControl, tint } from '../../components/kit';
import { useExamTextScale } from '../../textScale';
import { LEARN_SECTIONS, type LearnSectionId } from '../writingMeta';
import type { LessonStep, Station, StationResult } from './types';
import { Pop, WRITING_COLOR } from './ui';
import { darken } from '@/features/exam/components/kit';

function milestone(index: number, total: number): string | null {
  if (total < 4) return null;
  if (index === Math.floor(total / 2)) return 'Halbzeit! 🚀';
  if (index === total - 1) return 'Letzter Schritt! 🏁';
  return null;
}

/** Keeps the "already solved" flag as it was when the step opened, so a step does not flip mid-interaction. */
function StepHost({
  step,
  solved,
  onComplete,
}: {
  step: LessonStep;
  solved: boolean;
  onComplete: (correct?: boolean) => void;
}) {
  const [initiallySolved] = useState(solved);
  return <>{step.render({ solved: initiallySolved, complete: onComplete })}</>;
}

/**
 * One lesson: small steps shown one at a time under a progress bar, with "Zurück / Weiter" pinned at
 * the bottom. Gated steps (quizzes, games) must be completed before "Weiter" unlocks.
 */
function LessonShell({
  emoji,
  title,
  steps,
  onExit,
  onFinish,
}: {
  emoji: string;
  title: string;
  steps: LessonStep[];
  onExit: () => void;
  onFinish: (result: StationResult) => void;
}) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textScale = useExamTextScale();
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const canContinue = !step.gated || !!done[step.id];

  const complete = useCallback(
    (stepId: string) => (correct?: boolean) => {
      setDone((d) => (d[stepId] ? d : { ...d, [stepId]: true }));
      if (correct !== undefined) setResults((r) => (stepId in r ? r : { ...r, [stepId]: correct }));
    },
    [],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const next = () => {
    if (!canContinue) return;
    if (isLast) {
      const values = Object.values(results);
      onFinish({ correct: values.filter(Boolean).length, total: values.length });
      return;
    }
    const target = index + 1;
    const msg = milestone(target, steps.length);
    if (msg) {
      setBanner(msg);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setBanner(null), 1800);
    }
    setIndex(target);
  };

  const value = index + (done[step.id] || !step.gated ? 1 : 0);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <View style={styles.bar}>
          <IconButton name="close" label="Lektion verlassen" onPress={onExit} />
          <View style={{ flex: 1 }}>
            <ProgressBar
              value={value}
              max={steps.length}
              color={WRITING_COLOR}
              label={`Schritt ${index + 1} von ${steps.length}`}
            />
          </View>
          <AppText variant="small" color={colors.mutedForeground} style={styles.count}>
            {index + 1}/{steps.length}
          </AppText>
        </View>
      </SafeAreaView>
      <ExerciseFrame
        scrollTopKey={step.id}
        header={
          <View style={styles.headerRow}>
            <View style={styles.bannerSlot}>
              {banner ? (
                <Pop>
                  <View style={[styles.banner, { backgroundColor: WRITING_COLOR }]}>
                    <AppText
                      variant="small"
                      color="#FFFFFF"
                      style={{ fontWeight: '800' }}
                      accessibilityRole="alert"
                    >
                      {banner}
                    </AppText>
                  </View>
                </Pop>
              ) : (
                <AppText
                  variant="caption"
                  color={colors.mutedForeground}
                  style={{ fontWeight: '600' }}
                >
                  {emoji} {title}
                </AppText>
              )}
            </View>
            <TextSizeControl color={WRITING_COLOR} />
          </View>
        }
        footer={
          <>
            <View style={styles.nav}>
              <Button
                label="‹ Zurück"
                variant="secondary"
                disabled={index === 0}
                onPress={() => setIndex((i) => Math.max(0, i - 1))}
                color={darken(WRITING_COLOR)}
              />
              <View style={{ flex: 1 }}>
                <Button
                  pill
                  label={isLast ? 'Abschließen' : 'Weiter'}
                  disabled={!canContinue}
                  onPress={next}
                  color={WRITING_COLOR}
                />
              </View>
            </View>
            {!canContinue ? (
              <AppText variant="caption" center color={colors.mutedForeground}>
                Löse die Aufgabe, um weiterzumachen.
              </AppText>
            ) : null}
          </>
        }
      >
        <AppTextScale.Provider value={textScale}>
          <View key={step.id}>
            <StepHost step={step} solved={!!done[step.id]} onComplete={complete(step.id)} />
          </View>
        </AppTextScale.Provider>
      </ExerciseFrame>
    </View>
  );
}

/** End-of-lesson reaction: stars from the quiz result and clear next actions. */
function Celebration({
  correct,
  total,
  stationLabel,
  nextLabel,
  onNext,
  onRepeat,
  onOverview,
}: {
  correct: number;
  total: number;
  stationLabel: string;
  nextLabel: string | null;
  onNext: () => void;
  onRepeat: () => void;
  onOverview: () => void;
}) {
  const ratio = total === 0 ? 1 : correct / total;
  const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
  const message =
    stars === 3
      ? 'Ausgezeichnet!'
      : stars === 2
        ? 'Gut gemacht!'
        : 'Geschafft – Übung macht den Meister!';
  return (
    <ExerciseFrame
      footer={
        <>
          <Button
            pill
            label={nextLabel ? `Weiter: ${nextLabel}` : 'Jetzt Schreibaufgaben üben'}
            onPress={onNext}
            color={WRITING_COLOR}
          />
          <View style={styles.nav}>
            <View style={{ flex: 1 }}>
              <Button
                label="Noch einmal"
                variant="secondary"
                onPress={onRepeat}
                color={darken(WRITING_COLOR)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Zur Übersicht"
                variant="secondary"
                onPress={onOverview}
                color={darken(WRITING_COLOR)}
              />
            </View>
          </View>
        </>
      }
    >
      <View style={[styles.celebrate, { backgroundColor: tint(WRITING_COLOR, '14') }]}>
        <View
          style={styles.stars}
          accessibilityRole="image"
          accessibilityLabel={`${stars} von 3 Sternen`}
        >
          {[1, 2, 3].map((n) => (
            <Pop key={n}>
              <Ionicons name="star" size={52} color={n <= stars ? '#F5B50A' : colors.border} />
            </Pop>
          ))}
        </View>
        <AppText variant="title" center accessibilityRole="header">
          {message}
        </AppText>
        <AppText center color={colors.mutedForeground}>
          Du hast „{stationLabel}“ abgeschlossen.
        </AppText>
        {total > 0 ? (
          <View style={styles.score}>
            <AppText style={{ fontWeight: '700' }}>
              {correct} von {total} Fragen gleich richtig
            </AppText>
          </View>
        ) : null}
      </View>
    </ExerciseFrame>
  );
}

/** Runs one station, then shows the end-of-lesson reaction. "Noch einmal" restarts from the first step. */
export function LessonPlayer({
  station,
  nextStationId,
  onFinished,
  onNext,
  onExit,
}: {
  station: Station;
  nextStationId: LearnSectionId | null;
  onFinished: (id: LearnSectionId, result: StationResult) => void;
  onNext: (id: LearnSectionId | null) => void;
  onExit: () => void;
}) {
  const meta = LEARN_SECTIONS.find((s) => s.id === station.id)!;
  const nextMeta = nextStationId ? LEARN_SECTIONS.find((s) => s.id === nextStationId)! : null;
  const [result, setResult] = useState<StationResult | null>(null);
  const [run, setRun] = useState(0);

  if (result) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
          <View style={styles.bar}>
            <IconButton name="close" label="Zur Übersicht" onPress={onExit} />
          </View>
        </SafeAreaView>
        <Celebration
          correct={result.correct}
          total={result.total}
          stationLabel={meta.label}
          nextLabel={nextMeta?.label ?? null}
          onNext={() => onNext(nextStationId)}
          onRepeat={() => {
            setResult(null);
            setRun((r) => r + 1);
          }}
          onOverview={onExit}
        />
      </View>
    );
  }

  return (
    <LessonShell
      key={run}
      emoji={meta.emoji}
      title={meta.label}
      steps={station.steps}
      onExit={onExit}
      onFinish={(r) => {
        onFinished(station.id, r);
        setResult(r);
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  count: { width: 44, textAlign: 'right', fontVariant: ['tabular-nums'], paddingRight: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  bannerSlot: { flex: 1, minHeight: 28, justifyContent: 'center' },
  banner: { paddingHorizontal: spacing.lg, paddingVertical: 4, borderRadius: radius.pill },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  celebrate: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
  },
  stars: { flexDirection: 'row', gap: spacing.xs },
  score: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
});
