import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ExamExercise } from '@/types/exam';
import type { ExamPracticeSessionResult } from '@/types/examTime';
import { ExamTimeSummary } from './ExamTimeSummary';
import { ExamTimerBar } from './ExamTimerBar';
import { TIMED_SECTIONS } from './examTime';
import { useExamSession } from './hooks';
import { useExamTimerStore } from './timerStore';

/** True when this exercise gets a timer: a timed section with a resolved Teil. */
export const isTimedExercise = (e: Pick<ExamExercise, 'section' | 'teil'>) =>
  TIMED_SECTIONS.includes(e.section) && e.teil != null;

/**
 * Timer strip on an exercise screen. The clock starts when the exercise opens, pauses when the
 * learner leaves the screen or the app goes to the background, and continues from where it stopped
 * when the same exercise is opened again. Opening a different exercise starts a fresh run.
 */
export function ExamExerciseTimer({ exercise }: { exercise: ExamExercise }) {
  const { active, hasHydrated, busy, start, finish } = useExamSession();
  const restartSignal = useExamTimerStore((s) => s.restartSignal);
  const [stoppedResult, setStoppedResult] = useState<ExamPracticeSessionResult | null>(null);
  const [startError, setStartError] = useState(false);

  const eligible = isTimedExercise(exercise);
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
    void begin().then(onStarted);
  };

  // Open: continue this exercise's run if it is still the active one, else begin a new run.
  useEffect(() => {
    mounted.current = true;
    if (!eligible || !hasHydrated) return;

    const current = useExamTimerStore.getState().active;
    if (current?.scope === 'EXERCISE' && current.exerciseId === exercise.id) {
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
  }, [eligible, hasHydrated, exercise.id, begin, onStarted]);

  // "Erneut üben": the previous run ended on the result screen, so begin a new one.
  useEffect(() => {
    if (restartSignal === seenRestart.current) return;
    seenRestart.current = restartSignal;
    if (eligible && !useExamTimerStore.getState().active) void begin().then(onStarted);
  }, [restartSignal, eligible, begin, onStarted]);

  if (!eligible || !hasHydrated) return null;

  if (active?.scope === 'EXERCISE' && active.exerciseId === exercise.id) {
    return (
      <ExamTimerBar
        active={active}
        title="Zeit für diese Übung"
        actions={
          <Button
            label="Stopp"
            variant="secondary"
            loading={busy}
            onPress={async () => {
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

  return (
    <View style={{ gap: spacing.md }}>
      {stoppedResult ? <ExamTimeSummary result={stoppedResult} /> : null}
      <Card style={styles.stopped}>
        <AppText variant="small" color={colors.mutedForeground} style={{ flex: 1 }}>
          {startError ? 'Die Zeitmessung konnte nicht gestartet werden.' : 'Die Zeitmessung ist gestoppt.'}
        </AppText>
        <Button label="Zeit starten" variant="secondary" loading={busy} onPress={startByHand} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stopped: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
