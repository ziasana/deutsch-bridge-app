import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Card, EmptyState, ErrorState, Header, LearningCelebration, Screen, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { spacing } from '@/theme';
import { PracticeQuiz } from './components/PracticeQuiz';
import { WordCard } from './components/WordCard';
import { allLearned, firstUnlearnedIndex, learnedCount, nextIndex } from './flow';
import { useDailyWords, useMarkWordLearned, useSaveToVocabulary, useVocabularyExists } from './hooks';
import { buildQuestions, resultTitle } from './practice';

type Stage = 'learning' | 'celebrate' | 'practice' | 'result';

function WordSkeleton() {
  return (
    <View accessibilityLabel="Wörter werden geladen" style={{ gap: spacing.md }}>
      <Skeleton height={8} />
      <Card style={{ gap: spacing.md }}>
        <Skeleton width="30%" height={20} />
        <Skeleton width="70%" height={40} />
        <Skeleton height={24} />
        <Skeleton height={60} />
      </Card>
      <Skeleton height={48} />
    </View>
  );
}

export function DailyWordsScreen() {
  const router = useRouter();
  const { data: words, isPending, isError, error, refetch } = useDailyWords();
  const preferPersian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const mark = useMarkWordLearned();
  const save = useSaveToVocabulary();

  // Derived defaults: start on the first unlearned word, or on the celebration if everything is done.
  const [stageOverride, setStage] = useState<Stage | null>(null);
  const [indexOverride, setIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizRound, setQuizRound] = useState(0);

  const list = useMemo(() => words ?? [], [words]);
  const stage: Stage = stageOverride ?? (allLearned(list) ? 'celebrate' : 'learning');
  const index = Math.min(indexOverride ?? firstUnlearnedIndex(list), Math.max(list.length - 1, 0));
  const current = list[index];

  const { data: existing } = useVocabularyExists(current?.word ?? '');
  const isSaved = !!existing?.exists || (save.isSuccess && save.variables?.id === current?.id);

  // Quiz questions are fixed per round so re-renders don't reshuffle them mid-quiz.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => buildQuestions(list, preferPersian), [list, preferPersian, quizRound]);

  const goToDashboard = () => router.navigate('/home');

  const advance = (updated: typeof list) => {
    if (allLearned(updated)) {
      setStage('celebrate');
      return;
    }
    const next = nextIndex(updated, index);
    setIndex(next ?? firstUnlearnedIndex(updated));
  };

  const onContinue = () => {
    if (!current) return;
    if (current.learned) {
      advance(list);
      return;
    }
    mark.mutate(current, {
      onSuccess: () => advance(list.map((w) => (w.id === current.id ? { ...w, learned: true } : w))),
    });
  };

  let body;
  if (isPending) {
    body = <WordSkeleton />;
  } else if (isError) {
    body = <ErrorState error={error} onRetry={() => void refetch()} />;
  } else if (list.length === 0) {
    body = (
      <EmptyState
        emoji="🌱"
        title="Heute keine neuen Wörter"
        message="Für heute stehen keine Wörter bereit. Schau später wieder vorbei."
        actionLabel="Zum Dashboard"
        onAction={goToDashboard}
      />
    );
  } else if (stage === 'celebrate') {
    body = (
      <LearningCelebration
        title="Sehr gut!"
        subtitle="Daily Words abgeschlossen"
        progress={{ value: learnedCount(list), max: list.length }}
        progressLabel={`${learnedCount(list)} / ${list.length} Wörter gelernt`}
        encouragement="Ein kurzes Quiz festigt, was du gerade gelernt hast."
        primaryAction={{ label: 'Quiz starten', onPress: () => setStage('practice') }}
        secondaryAction={{ label: 'Zum Dashboard', onPress: goToDashboard }}
      />
    );
  } else if (stage === 'practice') {
    body = (
      <PracticeQuiz
        key={quizRound}
        questions={questions}
        onComplete={(s) => {
          setScore(s);
          setStage('result');
        }}
      />
    );
  } else if (stage === 'result') {
    body = (
      <LearningCelebration
        title={resultTitle(score, questions.length)}
        subtitle="Daily Words – Quiz"
        progress={{ value: score, max: questions.length }}
        progressLabel={`${score} von ${questions.length} richtig`}
        primaryAction={{
          label: 'Noch einmal üben',
          onPress: () => {
            setQuizRound((r) => r + 1);
            setStage('practice');
          },
        }}
        secondaryAction={{ label: 'Zum Dashboard', onPress: goToDashboard }}
      />
    );
  } else if (current) {
    body = (
      <WordCard
        word={current}
        index={index}
        total={list.length}
        learnedCount={learnedCount(list)}
        isLast={index === list.length - 1}
        isSaved={isSaved}
        isSaving={save.isPending}
        isMarking={mark.isPending}
        error={mark.error?.message ?? save.error?.message}
        canGoPrevious={index > 0}
        onPrevious={() => setIndex(index - 1)}
        onSave={() => save.mutate(current)}
        onContinue={onContinue}
      />
    );
  }

  return (
    <Screen>
      <Header title="Daily Words" subtitle="Deine Wörter für heute" back />
      {body}
    </Screen>
  );
}
