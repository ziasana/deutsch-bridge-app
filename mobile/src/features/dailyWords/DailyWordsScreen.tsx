import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LearningCelebration,
  ProgressRing,
  Skeleton,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import { DAILY_COLOR, DailyHero, SunriseIllustration } from './components/DailyViz';
import { PracticeQuiz } from './components/PracticeQuiz';
import { WordCard } from './components/WordCard';
import { allLearned, firstUnlearnedIndex, learnedCount, nextIndex } from './flow';
import {
  useDailyWords,
  useMarkWordLearned,
  useSaveToVocabulary,
  useVocabularyExists,
} from './hooks';
import { resultTitle } from '@/utils/feedback';
import { buildQuestions, type PracticeQuestion } from './practice';

type Stage = 'learning' | 'celebrate' | 'practice' | 'result';

function WordSkeleton() {
  const { t } = useI18n();
  return (
    <View accessibilityLabel={t.daily.loading} style={{ gap: spacing.md }}>
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
  const { t } = useI18n();
  const d = t.daily;
  const { data: words, isPending, isError, error, refetch } = useDailyWords();
  const preferPersian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const mark = useMarkWordLearned();
  const save = useSaveToVocabulary();

  // Derived defaults: start on the first unlearned word, or on the celebration if everything is done.
  const [stageOverride, setStage] = useState<Stage | null>(null);
  const [indexOverride, setIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [quizRound, setQuizRound] = useState(0);

  const list = useMemo(() => words ?? [], [words]);
  const stage: Stage = stageOverride ?? (allLearned(list) ? 'celebrate' : 'learning');
  const index = Math.min(indexOverride ?? firstUnlearnedIndex(list), Math.max(list.length - 1, 0));
  const current = list[index];

  const { data: existing } = useVocabularyExists(current?.word ?? '');
  const isSaved = !!existing?.exists || (save.isSuccess && save.variables?.id === current?.id);

  // Questions are generated when a round starts, so re-renders never reshuffle them mid-quiz.
  const startQuiz = () => {
    setQuestions(buildQuestions(list, preferPersian));
    setQuizRound((r) => r + 1);
    setStage('practice');
  };

  const goToDashboard = () => router.navigate('/home');

  // `justMarked`: this tap completed a word. Finishing the last open word celebrates immediately;
  // when merely browsing already-learned words, "Weiter" steps through them and celebrates at the end.
  const advance = (updated: typeof list, justMarked: boolean) => {
    if (justMarked && allLearned(updated)) {
      setStage('celebrate');
      return;
    }
    const next = nextIndex(updated, index);
    if (next !== null) {
      setIndex(next);
    } else if (allLearned(updated)) {
      setStage('celebrate');
    } else {
      setIndex(firstUnlearnedIndex(updated));
    }
  };

  const onContinue = () => {
    if (!current) return;
    if (current.learned) {
      advance(list, false);
      return;
    }
    mark.mutate(current, {
      onSuccess: () =>
        advance(
          list.map((w) => (w.id === current.id ? { ...w, learned: true } : w)),
          true,
        ),
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
        title={d.emptyTitle}
        message={d.emptyMessage}
        actionLabel={d.toDashboard}
        onAction={goToDashboard}
      />
    );
  } else if (stage === 'celebrate') {
    body = (
      <View style={{ gap: spacing.md }}>
        <LearningCelebration
          title={d.veryGood}
          subtitle={d.completed}
          progress={{ value: learnedCount(list), max: list.length }}
          progressLabel={d.learnedOf(learnedCount(list), list.length)}
          encouragement={d.quizEncouragement}
          primaryAction={{ label: d.startQuiz, onPress: startQuiz }}
          secondaryAction={{ label: d.toDashboard, onPress: goToDashboard }}
        />
        <View style={styles.recap}>
          <AppText variant="subheading">{d.learnedToday}</AppText>
          <View style={styles.recapChips}>
            {list.map((w, i) => (
              <Pressable
                key={w.id}
                accessibilityRole="button"
                accessibilityLabel={d.review(w.word)}
                onPress={() => {
                  setIndex(i);
                  setStage('learning');
                }}
                style={styles.recapChip}
              >
                <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '700' }}>
                  {w.word}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
        <Button
          label={d.seeAgain}
          variant="ghost"
          onPress={() => {
            setIndex(0);
            setStage('learning');
          }}
        />
      </View>
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
        title={resultTitle(score, questions.length, t.common.result)}
        subtitle={d.quizTitle}
        progress={{ value: score, max: questions.length }}
        progressLabel={t.grammar.correctOf(score, questions.length)}
        primaryAction={{
          label: d.practiceAgain,
          onPress: startQuiz,
        }}
        secondaryAction={{ label: d.toDashboard, onPress: goToDashboard }}
      />
    );
  } else if (current) {
    body = (
      <WordCard
        word={current}
        words={list}
        onJump={setIndex}
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

  const total = list.length;
  const done = learnedCount(list);
  const level = list[0]?.level;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <DailyHero
          chip={d.chip(level)}
          title={d.title}
          subtitle={d.subtitle(total)}
          right={
            total > 0 ? (
              <ProgressRing
                value={(done / total) * 100}
                size={80}
                stroke={9}
                color={DAILY_COLOR}
                textSize={18}
                trackColor="#FFFFFFCC"
                label={d.ringLabel}
              />
            ) : (
              <SunriseIllustration size={104} />
            )
          }
        />
        <View style={styles.body}>{body}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  body: { padding: spacing.lg },
  recap: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  recapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  recapChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});
