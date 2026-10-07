import { ErrorNotice } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReducer } from 'react';
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
  ProgressBar,
  Screen,
  Skeleton,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';
import { resultTitle } from '@/utils/feedback';
import { ContextQuestion } from './components/ContextQuestion';
import { Flashcard } from './components/Flashcard';
import { usePracticeSession, useSubmitRound } from './hooks';
import { initialState, sessionPercent, summarize, trainerReducer } from './trainerLogic';
import { VOCABULARY_COLOR, VOCABULARY_DARK } from './meta';

function SessionSkeleton() {
  const { t } = useI18n();
  return (
    <View accessibilityLabel={t.vocabulary.trainer.loading} style={{ gap: spacing.md }}>
      <Skeleton height={8} />
      <Card style={{ gap: spacing.md }}>
        <Skeleton width="60%" height={36} />
        <Skeleton height={120} />
      </Card>
    </View>
  );
}

export function VocabularyTrainerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const tr = t.vocabulary.trainer;
  const { vocabularyItemId } = useLocalSearchParams<{ vocabularyItemId?: string }>();
  const session = usePracticeSession(vocabularyItemId);
  const submit = useSubmitRound();
  const [state, dispatch] = useReducer(trainerReducer, initialState);

  const items = session.data?.items ?? [];
  const item = items[state.index];
  const goToDashboard = () => router.navigate('/home');

  const send = (knewIt: boolean, key: string | null) => {
    if (!item) return;
    submit.mutate(
      { vocabularyItemId: item.vocabularyItemId, flashcardKnewIt: knewIt, contextSelectedKey: key },
      { onSuccess: (round) => dispatch({ type: 'SUBMITTED', round }) },
    );
  };

  const grade = (knewIt: boolean) => {
    if (!item) return;
    dispatch({ type: 'GRADE', knewIt, hasContext: !!item.contextQuestion });
    if (!item.contextQuestion) send(knewIt, null);
  };

  const select = (key: string) => {
    if (state.knewIt === null) return;
    dispatch({ type: 'SELECT', key });
    send(state.knewIt, key);
  };

  const restart = () => {
    dispatch({ type: 'RESTART' });
    void session.refetch();
  };

  let body;
  if (session.isPending || (session.isFetching && state.stage === 'intro' && !session.data)) {
    body = <SessionSkeleton />;
  } else if (session.isError) {
    body = <ErrorState error={session.error} onRetry={() => void session.refetch()} />;
  } else if (items.length === 0) {
    body = (
      <EmptyState
        emoji="📚"
        title={tr.noneTitle}
        message={tr.noneMessage}
        actionLabel={tr.toDaily}
        onAction={() => router.push('/learn/daily-words')}
      />
    );
  } else if (state.stage === 'intro') {
    const { newCount, reviewCount } = session.data!;
    body = (
      <Card tone="accent" style={{ gap: spacing.md, padding: spacing.xl }}>
        <AppText variant="heading">{tr.ready(items.length)}</AppText>
        <AppText color={colors.mutedForeground}>{tr.counts(newCount, reviewCount)}</AppText>
        <AppText color={colors.mutedForeground}>{tr.intro}</AppText>
        <Button
          label={tr.start}
          onPress={() => dispatch({ type: 'START' })}
          color={VOCABULARY_COLOR}
        />
      </Card>
    );
  } else if (state.stage === 'done') {
    const s = summarize(state.results);
    body = (
      <LearningCelebration
        title={resultTitle(s.correct, s.total, t.common.result)}
        subtitle={tr.doneSubtitle}
        progress={{ value: s.correct, max: s.total }}
        progressLabel={t.grammar.correctOf(s.correct, s.total)}
        encouragement={
          s.contextAsked > 0
            ? tr.recallContext(s.recallAccuracy, s.contextAccuracy)
            : tr.recall(s.recallAccuracy)
        }
        primaryAction={{ label: tr.again, onPress: restart }}
        secondaryAction={{ label: tr.toDashboard, onPress: goToDashboard }}
      />
    );
  } else if (item) {
    const hasContext = !!item.contextQuestion;
    const judged = state.round !== null;
    const stepNumber = state.stage === 'flashcard' ? 1 : 2;
    body = (
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <AppText variant="subheading">{tr.wordOf(state.index + 1, items.length)}</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {item.level ? <Badge tone="primary" label={item.level} /> : null}
              {/* The flashcard shows the type itself; the question step keeps it in view. */}
              {item.wordType && state.stage !== 'flashcard' ? (
                <Badge label={t.vocabulary.wordTypes[item.wordType]} />
              ) : null}
              {hasContext ? <Badge label={tr.stepOf(stepNumber)} /> : null}
            </View>
          </View>
          <ProgressBar value={sessionPercent(state, items.length)} label={tr.progress} />
        </View>

        {(state.stage === 'flashcard' || (state.stage === 'result' && !hasContext)) && (
          <>
            <Flashcard
              item={item}
              flipped={state.flipped}
              onFlip={() => dispatch({ type: 'FLIP' })}
            />
            {!judged && state.flipped ? (
              <View style={{ gap: spacing.sm }}>
                <AppText variant="small" color={colors.mutedForeground} center>
                  {tr.didYouKnow}
                </AppText>
                <Button
                  label={tr.knew}
                  loading={submit.isPending}
                  onPress={() => grade(true)}
                  color={VOCABULARY_COLOR}
                />
                <Button
                  label={tr.didNotKnow}
                  variant="secondary"
                  disabled={submit.isPending}
                  onPress={() => grade(false)}
                  color={VOCABULARY_DARK}
                />
              </View>
            ) : null}
          </>
        )}

        {(state.stage === 'context' || (state.stage === 'result' && hasContext)) &&
        item.contextQuestion ? (
          <ContextQuestion
            question={item.contextQuestion}
            selectedKey={state.selectedKey}
            correctKey={state.round?.correctContextKey ?? null}
            busy={submit.isPending}
            onSelect={select}
          />
        ) : null}

        {submit.error ? <ErrorNotice error={submit.error} /> : null}

        {judged && state.round ? (
          <Card tone="accent" style={{ gap: spacing.sm }}>
            <AppText variant="subheading" accessibilityRole="alert">
              {state.round.flashcardCorrect ? tr.knewResult : tr.didNotKnowResult}
              {state.round.contextCorrect === null
                ? ''
                : state.round.contextCorrect
                  ? tr.contextRight
                  : tr.contextWrong}
            </AppText>
            <Badge
              tone="primary"
              label={tr.stage(t.vocabulary.mastery[state.round.progress.masteryLevel])}
            />
            <Button
              label={state.index + 1 >= items.length ? tr.seeResult : tr.next}
              onPress={() => dispatch({ type: 'NEXT', total: items.length })}
              color={VOCABULARY_COLOR}
            />
          </Card>
        ) : null}
      </View>
    );
  }

  return (
    <Screen>
      <Header title={tr.title} subtitle={tr.subtitle} back />
      {body}
    </Screen>
  );
}
