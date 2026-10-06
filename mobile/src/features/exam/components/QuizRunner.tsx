import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, EmptyState, ErrorState, ProgressRing } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ExamExercise, StartExamAttemptResponse } from '@/types/exam';
import type { ExamPracticeSessionResult } from '@/types/examTime';
import { answerLabelFor } from '../content';
import { exercisesForSectionAndLevel, groupIntoParts } from '../examData';
import { HOEREN_HOWTO, SECTION_META, TASK_HOWTO } from '../examMeta';
import { useExamExercises, useMarkExamCompleted, useStartExamAttempt } from '../hooks';
import { useStopExerciseTimer } from '../time/hooks';
import { useExamTimerStore } from '../time/timerStore';
import { BatchQuiz, type BatchVariant } from './BatchQuiz';
import { ExerciseFrame, tint } from './kit';
import { ResultsView, type ResultsState } from './Results';
import { StepQuiz } from './StepQuiz';

export type QuizKind = 'step' | BatchVariant;

/** Which quiz flow an exercise uses (same split as the web app). */
export function quizKindFor(exercise: ExamExercise): QuizKind {
  if (exercise.section === 'HOERVERSTEHEN') return 'hoeren';
  if (exercise.taskType === 'WORD_BANK_CLOZE' || exercise.taskType === 'SITUATION_MATCHING') {
    return 'grid';
  }
  return 'step';
}

/** The exercise after this one in its Teil that is not mastered yet (null when there is none). */
function useNextExercise(exercise: ExamExercise) {
  const list = useExamExercises(exercise.level);
  return useMemo(() => {
    if (!exercise.level || !list.data) return null;
    const groups = groupIntoParts(
      exercisesForSectionAndLevel(list.data, exercise.section, exercise.level),
      exercise.section,
    );
    const group = groups.find((g) => g.items.some((i) => i.id === exercise.id));
    if (!group) return null;
    const at = group.items.findIndex((i) => i.id === exercise.id);
    const after = [...group.items.slice(at + 1), ...group.items.slice(0, at)];
    return after.find((i) => !i.completed || (i.lastScore ?? 0) < 100) ?? null;
  }, [list.data, exercise.id, exercise.level, exercise.section]);
}

function Step({ icon, text, color }: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepIcon, { backgroundColor: tint(color, '1F') }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <AppText style={{ flex: 1 }}>{text}</AppText>
    </View>
  );
}

/** Before the first question: what this is, how it works and how long it takes. */
function StartCard({
  exercise,
  kind,
  loading,
  error,
  onStart,
  onRetryStart,
}: {
  exercise: ExamExercise;
  kind: QuizKind;
  loading: boolean;
  error: Error | null;
  onStart: () => void;
  onRetryStart: () => void;
}) {
  const meta = SECTION_META[exercise.section];
  const count = exercise.questions.length;
  const howTo = kind === 'hoeren' ? HOEREN_HOWTO : exercise.taskType ? TASK_HOWTO[exercise.taskType] : null;
  const instantFeedback = kind === 'step';
  return (
    <ExerciseFrame
      footer={
        error ? (
          <ErrorState error={error} onRetry={onRetryStart} />
        ) : (
          <Button pill label="Übung starten" loading={loading} onPress={onStart} />
        )
      }
    >
      <View style={[styles.hero, { backgroundColor: tint(meta.color, '14') }]}>
        <View style={[styles.heroIcon, { backgroundColor: tint(meta.color, '33') }]}>
          <AppText style={{ fontSize: 40, lineHeight: 50 }} accessibilityElementsHidden>
            {meta.emoji}
          </AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" color={meta.color} style={{ fontWeight: '800' }}>
            {meta.label.toUpperCase()}
            {exercise.level ? ` · ${exercise.level}` : ''}
          </AppText>
          <AppText style={styles.heroTitle}>{exercise.title}</AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {count > 0 ? `${count} ${count === 1 ? 'Aufgabe' : 'Aufgaben'}` : 'Aufgaben'}
            {exercise.lastScore != null ? ' · schon geübt' : ' · neu'}
          </AppText>
        </View>
        {exercise.lastScore != null ? (
          <ProgressRing
            value={exercise.lastScore}
            size={56}
            stroke={6}
            textSize={13}
            color={meta.color}
            label="Letztes Ergebnis"
          />
        ) : null}
      </View>

      {exercise.teilDescription ? (
        <View style={styles.desc}>
          <AppText>{exercise.teilDescription}</AppText>
        </View>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">So geht’s</AppText>
        {howTo ? <Step icon="create-outline" text={howTo} color={meta.color} /> : null}
        <Step
          icon={instantFeedback ? 'flash-outline' : 'shield-checkmark-outline'}
          text={
            instantFeedback
              ? 'Nach jeder Aufgabe siehst du sofort, ob sie stimmt – mit Erklärung.'
              : 'Das Ergebnis siehst du erst am Ende – wie in der echten Prüfung.'
          }
          color={meta.color}
        />
        <Step
          icon="trophy-outline"
          text="Am Ende bekommst du deine Auswertung mit allen Erklärungen."
          color={meta.color}
        />
      </View>
    </ExerciseFrame>
  );
}

/** Start card → attempt → results. Finishing counts as completing the exercise, whatever the score. */
export function QuizRunner({ exercise }: { exercise: ExamExercise }) {
  const start = useStartExamAttempt();
  const markCompleted = useMarkExamCompleted(exercise.id);
  const stopTimer = useStopExerciseTimer(exercise.id);
  const nextExercise = useNextExercise(exercise);
  const [timeResult, setTimeResult] = useState<ExamPracticeSessionResult | null>(null);
  const [attempt, setAttempt] = useState<StartExamAttemptResponse | null>(null);
  const [results, setResults] = useState<ResultsState | null>(null);
  const kind = quizKindFor(exercise);
  const color = SECTION_META[exercise.section].color;

  const begin = () => start.mutate(exercise.id, { onSuccess: setAttempt });
  const retry = () => {
    setResults(null);
    setAttempt(null);
    setTimeResult(null);
    // A new run starts with the next attempt (the exercise timer listens for this).
    useExamTimerStore.getState().requestRestart();
  };
  const finish = (r: ResultsState) => {
    setResults(r);
    if (!exercise.completed && !markCompleted.isPending) markCompleted.mutate();
    // The timer stops by itself when the result appears; its Zeit-Check joins the score.
    void stopTimer().then(setTimeResult);
  };

  if (results) {
    return (
      <ResultsView
        results={results}
        color={color}
        defaultExplanation={exercise.defaultExplanation}
        defaultCommonMistake={exercise.defaultCommonMistake}
        formatAnswer={
          exercise.taskType === 'SITUATION_MATCHING'
            ? (v) => answerLabelFor(exercise.passages, v)
            : undefined
        }
        timeResult={timeResult}
        next={nextExercise ? { id: nextExercise.id, title: nextExercise.title } : null}
        onRetry={retry}
      />
    );
  }

  if (!attempt) {
    return (
      <StartCard
        exercise={exercise}
        kind={kind}
        loading={start.isPending}
        error={start.isError ? start.error : null}
        onStart={begin}
        onRetryStart={begin}
      />
    );
  }

  if (attempt.questions.length === 0) {
    return (
      <View style={{ padding: spacing.lg }}>
        <EmptyState emoji="🗒️" title="Noch keine Aufgaben" message="Diese Übung enthält noch keine Aufgaben." />
      </View>
    );
  }

  return kind === 'step' ? (
    <StepQuiz key={attempt.attemptId} exercise={exercise} attempt={attempt} onFinish={finish} />
  ) : (
    <BatchQuiz key={attempt.attemptId} variant={kind} exercise={exercise} attempt={attempt} onFinish={finish} />
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  heroIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.ink },
  desc: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
