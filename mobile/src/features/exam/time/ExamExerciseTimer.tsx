import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';
import type { ExamExercise } from '@/types/exam';
import type { ExamPracticeSessionResult } from '@/types/examTime';
import { ExamTimeSummary } from './ExamTimeSummary';
import { ExamTimerBar, TimerPill } from './ExamTimerBar';
import { TIMED_SECTIONS } from './examTime';
import { useExamSession, useExamTimeConfiguration } from './hooks';
import { useExamTimerStore } from './timerStore';

/** True when this exercise gets a timer: a timed section with a resolved Teil. */
export const isTimedExercise = (e: Pick<ExamExercise, 'section' | 'teil'>) =>
  TIMED_SECTIONS.includes(e.section) && e.teil != null;

/**
 * Timer strip on an exercise screen. The clock starts when the exercise opens, pauses when the
 * learner leaves the screen or the app goes to the background, and continues from where it stopped
 * when the same exercise is opened again. Opening a different exercise starts a fresh run.
 */
export function ExamExerciseTimer({
  exercise,
  armed = true,
  fresh = false,
}: {
  exercise: ExamExercise;
  /** The clock only runs once armed: quizzes arm it when the learner taps "Übung starten". */
  armed?: boolean;
  /** Always begin a new run when armed instead of continuing this exercise's earlier one. */
  fresh?: boolean;
}) {
  const { t } = useI18n();
  const tr = t.examRun.timer;
  const { active, hasHydrated, busy, start, finish } = useExamSession();
  const restartSignal = useExamTimerStore((s) => s.restartSignal);
  const [stoppedResult, setStoppedResult] = useState<ExamPracticeSessionResult | null>(null);
  const [startError, setStartError] = useState(false);
  const [stoppedByHand, setStoppedByHand] = useState(false);

  const eligible = isTimedExercise(exercise);
  const { minutes } = useExamTimeConfiguration(exercise.level, exercise.section, exercise.teil);
  const mounted = useRef(false);
  const starting = useRef(false);
  const seenRestart = useRef(restartSignal);

  /** Begins a new run; resolves false when it could not be started. Touches no component state. */
  const begin = useCallback(async (): Promise<boolean> => {
    if (starting.current) return true;
    starting.current = true;
    try {
      await start({ scope: 'EXERCISE', mode: 'TIME_TRAINING', exerciseId: exercise.id });
      // The learner may have left while the request was in flight: do not let the clock run unseen.
      if (!mounted.current) useExamTimerStore.getState().pause();
      return true;
    } catch {
      return false;
    } finally {
      starting.current = false;
    }
  }, [exercise.id, start]);

  const onStarted = useCallback((ok: boolean) => setStartError(!ok), []);

  /** "Zeit starten" button: a fresh attempt clears the previous Zeit-Check and error. */
  const startByHand = () => {
    setStartError(false);
    setStoppedResult(null);
    setStoppedByHand(false);
    void begin().then(onStarted);
  };

  // Open: continue this exercise's run if it is still the active one, else begin a new run.
  useEffect(() => {
    mounted.current = true;
    if (!eligible || !hasHydrated || !armed) return;

    const current = useExamTimerStore.getState().active;
    if (!fresh && current?.scope === 'EXERCISE' && current.exerciseId === exercise.id) {
      useExamTimerStore.getState().resume();
    } else {
      void begin().then(onStarted);
    }

    const isThisRun = () => {
      const run = useExamTimerStore.getState().active;
      return run?.scope === 'EXERCISE' && run.exerciseId === exercise.id ? run : null;
    };
    // Only a pause made by backgrounding is undone automatically; a manual pause stays.
    let autoPaused = false;
    const sub = AppState.addEventListener('change', (state) => {
      const run = isThisRun();
      if (!run) return;
      if (state !== 'active' && run.pausedAtMs == null) {
        useExamTimerStore.getState().pause();
        autoPaused = true;
      } else if (state === 'active' && autoPaused) {
        useExamTimerStore.getState().resume();
        autoPaused = false;
      }
    });

    return () => {
      mounted.current = false;
      sub.remove();
      if (isThisRun()) useExamTimerStore.getState().pause();
    };
  }, [eligible, hasHydrated, armed, fresh, exercise.id, begin, onStarted]);

  // "Erneut üben": the previous run ended on the result screen, so begin a new one.
  useEffect(() => {
    if (restartSignal === seenRestart.current) return;
    seenRestart.current = restartSignal;
    if (armed && eligible && !useExamTimerStore.getState().active) void begin().then(onStarted);
  }, [restartSignal, armed, eligible, begin, onStarted]);

  if (!eligible || !hasHydrated) return null;

  // Before the first question the clock waits; it starts with "Übung starten".
  if (!armed) {
    return (
      <View style={styles.waiting}>
        <Ionicons name="timer-outline" size={20} color={colors.mutedForeground} />
        <AppText variant="small" color={colors.mutedForeground} style={{ flex: 1 }}>
          {tr.waiting(minutes, t.examRun.startButton)}
        </AppText>
      </View>
    );
  }

  if (active?.scope === 'EXERCISE' && active.exerciseId === exercise.id) {
    return (
      <ExamTimerBar
        active={active}
        title={tr.barTitle}
        actions={
          <TimerPill
            label={tr.stop}
            text={tr.stop}
            busy={busy}
            onPress={async () => {
              setStoppedByHand(true);
              const result = await finish();
              if (result) {
                useExamTimerStore.getState().setLastResult(result);
                setStoppedResult(result);
              }
            }}
          />
        }
      />
    );
  }

  // After a finished quiz the result screen carries the Zeit-Check; only a manual stop or a failed
  // start needs the "start again" strip.
  if (!stoppedByHand && !startError) return null;

  return (
    <View>
      {stoppedResult ? (
        <View style={{ padding: spacing.lg, backgroundColor: colors.surface }}>
          <ExamTimeSummary result={stoppedResult} />
        </View>
      ) : null}
      <View style={styles.stopped}>
        <AppText variant="small" color={colors.mutedForeground} style={{ flex: 1 }}>
          {startError ? tr.startFailed : tr.stopped}
        </AppText>
        <TimerPill label={tr.startTimer} text={tr.startTimer} busy={busy} onPress={startByHand} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stopped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
