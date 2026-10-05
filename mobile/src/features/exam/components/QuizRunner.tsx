import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, EmptyState, ErrorState } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ExamExercise, StartExamAttemptResponse } from '@/types/exam';
import { answerLabelFor } from '../content';
import { useMarkExamCompleted, useStartExamAttempt } from '../hooks';
import { BatchQuiz, type BatchVariant } from './BatchQuiz';
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

/** Start card → attempt → results. Finishing counts as completing the exercise, whatever the score. */
export function QuizRunner({ exercise }: { exercise: ExamExercise }) {
  const start = useStartExamAttempt();
  const markCompleted = useMarkExamCompleted(exercise.id);
  const [attempt, setAttempt] = useState<StartExamAttemptResponse | null>(null);
  const [results, setResults] = useState<ResultsState | null>(null);
  const kind = quizKindFor(exercise);

  const begin = () => start.mutate(exercise.id, { onSuccess: setAttempt });
  const retry = () => {
    setResults(null);
    setAttempt(null);
  };
  const finish = (r: ResultsState) => {
    setResults(r);
    if (!exercise.completed && !markCompleted.isPending) markCompleted.mutate();
  };

  if (results) {
    return (
      <ResultsView
        results={results}
        defaultExplanation={exercise.defaultExplanation}
        defaultCommonMistake={exercise.defaultCommonMistake}
        formatAnswer={
          exercise.taskType === 'SITUATION_MATCHING'
            ? (v) => answerLabelFor(exercise.passages, v)
            : undefined
        }
        onRetry={retry}
      />
    );
  }

  if (!attempt) {
    return (
      <Card style={{ gap: spacing.md }}>
        <AppText color={colors.mutedForeground}>
          Bereit? Starte die Übung und bearbeite die Aufgaben der Reihe nach.
        </AppText>
        {start.isError ? <ErrorState error={start.error} onRetry={begin} /> : null}
        {!start.isError ? <Button label="Übung starten" loading={start.isPending} onPress={begin} /> : null}
      </Card>
    );
  }

  if (attempt.questions.length === 0) {
    return (
      <View>
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
