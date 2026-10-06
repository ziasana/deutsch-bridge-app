import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LearningCelebration,
  Screen,
  Skeleton,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import { QuizRunner } from './components/QuizRunner';
import {
  useExerciseProgress,
  useLesson,
  useResetAnswers,
  useSaveAnswer,
  useSetLessonLearned,
} from './hooks';
import { lessonQuestions, localizedHeading, questionKey } from './quiz';
import { resultTitle } from '@/utils/feedback';

type Phase = 'idle' | 'active' | 'results';

export function LessonQuizScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const g = t.grammar;
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const persian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const lessonQuery = useLesson(lessonId);
  const progress = useExerciseProgress();
  const save = useSaveAnswer();
  const reset = useResetAnswers();
  const setLearned = useSetLessonLearned(lessonId);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [round, setRound] = useState(0);

  const lesson = lessonQuery.data;
  const questions = useMemo(() => (lesson ? lessonQuestions(lesson) : []), [lesson]);

  // Saved answers for THIS lesson, by question key.
  const saved = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const a of progress.data ?? [])
      if (a.questionKey.startsWith(`${lessonId}:`)) map.set(a.questionKey, a.correct);
    return map;
  }, [progress.data, lessonId]);

  const firstUnanswered = questions.findIndex((q) => !saved.has(questionKey(lessonId, q.index)));
  const answeredCount =
    questions.length - questions.filter((q) => !saved.has(questionKey(lessonId, q.index))).length;
  const savedCorrect = questions.filter((q) => saved.get(questionKey(lessonId, q.index))).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const title = lesson ? localizedHeading(lesson, persian).title : g.quizTitle;

  if (lessonQuery.isPending || progress.isPending) {
    return (
      <Screen>
        <Header title={g.quizTitle} back />
        <View accessibilityLabel={g.quizLoading} style={{ gap: spacing.md }}>
          <Skeleton height={8} />
          <Card style={{ gap: spacing.sm }}>
            <Skeleton height={24} />
            <Skeleton height={48} />
          </Card>
        </View>
      </Screen>
    );
  }
  if (lessonQuery.isError || progress.isError || !lesson) {
    return (
      <Screen>
        <Header title={g.quizTitle} back />
        <ErrorState
          error={lessonQuery.error ?? progress.error}
          onRetry={() => {
            void lessonQuery.refetch();
            void progress.refetch();
          }}
        />
      </Screen>
    );
  }
  if (questions.length === 0) {
    return (
      <Screen>
        <Header title={title} back />
        <EmptyState
          emoji="🧩"
          title={g.noExercisesTitle}
          message={g.noExercisesMessage}
          actionLabel={g.toLesson}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  // Everything answered before → straight to the results, like the web app.
  const current: Phase = phase ?? (allAnswered ? 'results' : 'idle');
  const correctNow = current === 'results' && phase === null ? savedCorrect : finalCorrect;

  const finish = (correct: number) => {
    setFinalCorrect(correct);
    setPhase('results');
    // Every question right → the lesson counts as learned (best effort, same rule as web).
    if (correct === questions.length) setLearned.mutate(true);
  };

  const retry = () => {
    const keys = questions.map((q) => questionKey(lessonId, q.index));
    reset.mutate(keys, {
      onSuccess: () => {
        setRound((r) => r + 1);
        setFinalCorrect(0);
        setPhase('active');
      },
    });
  };

  let body;
  if (current === 'idle') {
    body = (
      <Card tone="accent" style={{ gap: spacing.md, padding: spacing.xl }}>
        <AppText variant="heading">{g.questionsHeading(questions.length)}</AppText>
        <AppText color={colors.mutedForeground}>
          {answeredCount > 0 ? g.alreadyAnswered(answeredCount, questions.length) : g.testYourself}
        </AppText>
        <Button
          label={answeredCount > 0 ? g.continue : g.start}
          onPress={() => setPhase('active')}
        />
      </Card>
    );
  } else if (current === 'active') {
    body = (
      <QuizRunner
        key={round}
        questions={questions}
        persian={persian}
        startIndex={Math.max(firstUnanswered, 0)}
        initialCorrect={
          firstUnanswered > 0
            ? questions
                .slice(0, firstUnanswered)
                .filter((q) => saved.get(questionKey(lessonId, q.index))).length
            : 0
        }
        onAnswered={(q, correct) =>
          save.mutate({ questionKey: questionKey(lessonId, q.index), correct })
        }
        onFinish={finish}
      />
    );
  } else {
    const perfect = correctNow === questions.length;
    body = (
      <LearningCelebration
        title={resultTitle(correctNow, questions.length, t.common.result)}
        subtitle={perfect ? g.allRight : g.exercisesDone}
        progress={{ value: correctNow, max: questions.length }}
        progressLabel={g.correctOf(correctNow, questions.length)}
        encouragement={perfect ? undefined : g.everyRound}
        primaryAction={{ label: g.practiceAgain, onPress: retry }}
        secondaryAction={{ label: g.toLesson, onPress: () => router.back() }}
      />
    );
  }

  return (
    <Screen keyboardAware>
      <Header title={title} subtitle={g.quizTitle} back />
      {save.isError ? (
        <AppText variant="small" color={colors.destructive} accessibilityRole="alert">
          {g.saveFailed}
        </AppText>
      ) : null}
      {reset.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {reset.error.message}
        </AppText>
      ) : null}
      {body}
    </Screen>
  );
}
