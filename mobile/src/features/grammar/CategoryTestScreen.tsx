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
import { useAuthStore } from '@/stores/authStore';
import { shuffle } from '@/utils/random';
import { colors, spacing } from '@/theme';
import { QuizRunner } from './components/QuizRunner';
import { useCategory, useMarkCategoryComplete, useSubmitCategoryTest } from './hooks';
import { CATEGORY_TEST_MAX_QUESTIONS, lessonQuestions, type RunnerQuestion } from './quiz';

type Phase = 'idle' | 'active' | 'results';

export function CategoryTestScreen() {
  const router = useRouter();
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
        <Header title="Kategorie-Test" back />
        <View accessibilityLabel="Test wird geladen" style={{ gap: spacing.md }}>
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
        <Header title="Kategorie-Test" back />
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
        title="Noch keine Übungen"
        message="In dieser Kategorie gibt es noch keine Fragen für einen Test."
        actionLabel="Zurück"
        onAction={() => router.back()}
      />
    );
  } else if (phase === 'idle') {
    body = (
      <Card tone="accent" style={{ gap: spacing.md, padding: spacing.xl }}>
        {status.attempted ? (
          <View style={{ gap: spacing.xs }}>
            <AppText>
              Letzter Versuch: {status.score} von {status.total}
            </AppText>
            <Badge
              tone={status.passed ? 'success' : 'warning'}
              label={status.passed ? '✓ Bestanden' : 'Noch nicht bestanden'}
            />
            {status.completed ? <Badge tone="success" label="✓ Abgeschlossen" /> : null}
          </View>
        ) : null}
        <AppText color={colors.mutedForeground}>
          {questionCount} Fragen aus den Lektionen dieser Kategorie. Zum Bestehen brauchst du
          mindestens {category.passThreshold}%.
        </AppText>
        <Button label={status.attempted ? 'Test wiederholen' : 'Test starten'} onPress={begin} />
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
          title={passedNow === false ? 'Gut gemacht!' : passedNow ? 'Bestanden!' : 'Ergebnis'}
          subtitle={title}
          progress={{ value: score, max: picked.length }}
          progressLabel={`${score} von ${picked.length} richtig`}
          encouragement={
            passedNow === null
              ? 'Ergebnis wird gespeichert …'
              : passedNow
                ? `Du hast die ${category.passThreshold}% erreicht.`
                : `Du brauchst ${category.passThreshold}% zum Bestehen. Wiederhole die Lektionen und versuche es noch einmal.`
          }
          primaryAction={{ label: 'Test wiederholen', onPress: begin }}
          secondaryAction={{ label: 'Zurück zur Liste', onPress: () => router.back() }}
        />
        {submit.isError ? (
          <View style={{ gap: spacing.sm }}>
            <AppText color={colors.destructive} accessibilityRole="alert">
              {submit.error.message}
            </AppText>
            <Button
              label="Ergebnis erneut speichern"
              variant="secondary"
              onPress={() => submit.mutate({ score, total: picked.length })}
            />
          </View>
        ) : null}
        {passedNow && !resultStatus.completed ? (
          <Button
            label="Als abgeschlossen markieren"
            loading={complete.isPending}
            onPress={() => complete.mutate()}
          />
        ) : null}
        {resultStatus.completed ? <Badge tone="success" label="✓ Kategorie abgeschlossen" /> : null}
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
      <Header title="Kategorie-Test" subtitle={title} back />
      {body}
    </Screen>
  );
}
