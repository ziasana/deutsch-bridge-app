import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  AppText,
  Badge,
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
import { shuffle } from '@/utils/random';
import { colors, spacing } from '@/theme';
import { QuizRunner } from './components/QuizRunner';
import { useCategory, useMarkCategoryComplete, useSubmitCategoryTest } from './hooks';
import { CATEGORY_TEST_MAX_QUESTIONS, lessonQuestions, type RunnerQuestion } from './quiz';

type Phase = 'idle' | 'active' | 'results';

export function CategoryTestScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const c = t.grammar.categoryTest;
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const persian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const categoryQuery = useCategory(categoryId);
  const submit = useSubmitCategoryTest(categoryId);
  const complete = useMarkCategoryComplete(categoryId);
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<RunnerQuestion[]>([]);
  const [score, setScore] = useState(0);

  const category = categoryQuery.data;
  // Only questions that can really be answered make it into the pool.
  const pool = useMemo(
    () => (category?.lessons ?? []).flatMap((l) => lessonQuestions(l)),
    [category],
  );

  if (categoryQuery.isPending) {
    return (
      <Screen>
        <Header title={c.title} back />
        <View accessibilityLabel={c.loading} style={{ gap: spacing.md }}>
          <Card style={{ gap: spacing.sm }}>
            <Skeleton height={24} />
            <Skeleton height={48} />
          </Card>
        </View>
      </Screen>
    );
  }
  if (categoryQuery.isError || !category) {
    return (
      <Screen>
        <Header title={c.title} back />
        <ErrorState error={categoryQuery.error} onRetry={() => void categoryQuery.refetch()} />
      </Screen>
    );
  }

  const title = (persian && category.level !== 'B2' && category.titleFa) || category.title;
  const status = category.testStatus;
  const questionCount = Math.min(CATEGORY_TEST_MAX_QUESTIONS, pool.length);

  const begin = () => {
    setPicked(shuffle(pool).slice(0, questionCount));
    setScore(0);
    setPhase('active');
  };

  const finish = (correct: number) => {
    setScore(correct);
    setPhase('results');
    submit.mutate({ score: correct, total: picked.length });
  };

  let body;
  if (pool.length === 0) {
    body = (
      <EmptyState
        emoji="🧩"
        title={c.noneTitle}
        message={c.noneMessage}
        actionLabel={t.common.back}
        onAction={() => router.back()}
      />
    );
  } else if (phase === 'idle') {
    body = (
      <Card tone="accent" style={{ gap: spacing.md, padding: spacing.xl }}>
        {status.attempted ? (
          <View style={{ gap: spacing.xs }}>
            <AppText>{c.lastAttempt(status.score, status.total)}</AppText>
            <Badge
              tone={status.passed ? 'success' : 'warning'}
              label={status.passed ? c.passed : c.notPassed}
            />
            {status.completed ? <Badge tone="success" label={c.completedBadge} /> : null}
          </View>
        ) : null}
        <AppText color={colors.mutedForeground}>
          {c.intro(questionCount, category.passThreshold)}
        </AppText>
        <Button label={status.attempted ? c.retake : c.start} onPress={begin} />
      </Card>
    );
  } else if (phase === 'active') {
    body = <QuizRunner questions={picked} persian={persian} onFinish={finish} />;
  } else {
    // Latest known status: completion beats the test submission, which beats what we loaded.
    const resultStatus = complete.data ?? submit.data ?? status;
    const passedNow = submit.isPending ? null : resultStatus.passed;
    body = (
      <View style={{ gap: spacing.md }}>
        <LearningCelebration
          title={passedNow === false ? c.wellDone : passedNow ? c.passedTitle : c.result}
          subtitle={title}
          progress={{ value: score, max: picked.length }}
          progressLabel={t.grammar.correctOf(score, picked.length)}
          encouragement={
            passedNow === null
              ? c.saving
              : passedNow
                ? c.reached(category.passThreshold)
                : c.needs(category.passThreshold)
          }
          primaryAction={{ label: c.retake, onPress: begin }}
          secondaryAction={{ label: c.backToList, onPress: () => router.back() }}
        />
        {submit.isError ? (
          <View style={{ gap: spacing.sm }}>
            <AppText color={colors.destructive} accessibilityRole="alert">
              {submit.error.message}
            </AppText>
            <Button
              label={c.saveAgain}
              variant="secondary"
              onPress={() => submit.mutate({ score, total: picked.length })}
            />
          </View>
        ) : null}
        {passedNow && !resultStatus.completed ? (
          <Button
            label={c.markComplete}
            loading={complete.isPending}
            onPress={() => complete.mutate()}
          />
        ) : null}
        {resultStatus.completed ? <Badge tone="success" label={c.categoryCompleted} /> : null}
        {complete.isError ? (
          <AppText color={colors.destructive} accessibilityRole="alert">
            {complete.error.message}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <Screen keyboardAware>
      <Header title={c.title} subtitle={title} back />
      {body}
    </Screen>
  );
}
