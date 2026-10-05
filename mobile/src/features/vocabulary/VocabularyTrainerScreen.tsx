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
import { colors, spacing } from '@/theme';
import { resultTitle } from '@/utils/feedback';
import { ContextQuestion } from './components/ContextQuestion';
import { Flashcard } from './components/Flashcard';
import { usePracticeSession, useSubmitRound } from './hooks';
import {
  MASTERY_LABEL,
  initialState,
  sessionPercent,
  summarize,
  trainerReducer,
} from './trainerLogic';

function SessionSkeleton() {
  return (
    <View accessibilityLabel="Training wird geladen" style={{ gap: spacing.md }}>
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
        title="Noch keine Wörter zum Üben"
        message="Speichere Wörter aus Daily Words oder dem Tutor, dann erscheinen sie hier."
        actionLabel="Zu Daily Words"
        onAction={() => router.push('/learn/daily-words')}
      />
    );
  } else if (state.stage === 'intro') {
    const { newCount, reviewCount } = session.data!;
    body = (
      <Card tone="accent" style={{ gap: spacing.md, padding: spacing.xl }}>
        <AppText variant="heading">{items.length} Wörter bereit</AppText>
        <AppText color={colors.mutedForeground}>
          {newCount} neu · {reviewCount} zur Wiederholung
        </AppText>
        <AppText color={colors.mutedForeground}>
          Dreh die Karte um, bewerte dich ehrlich und beantworte die Kontextfrage.
        </AppText>
        <Button label="Training starten" onPress={() => dispatch({ type: 'START' })} />
      </Card>
    );
  } else if (state.stage === 'done') {
    const s = summarize(state.results);
    body = (
      <LearningCelebration
        title={resultTitle(s.correct, s.total)}
        subtitle="Vocabulary-Training abgeschlossen"
        progress={{ value: s.correct, max: s.total }}
        progressLabel={`${s.correct} von ${s.total} richtig`}
        encouragement={
          s.contextAsked > 0
            ? `Erinnern: ${s.recallAccuracy}% · Kontext: ${s.contextAccuracy}%`
            : `Erinnern: ${s.recallAccuracy}%`
        }
        primaryAction={{ label: 'Noch einmal', onPress: restart }}
        secondaryAction={{ label: 'Zurück zum Dashboard', onPress: goToDashboard }}
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
            <AppText variant="subheading">
              Wort {state.index + 1} von {items.length}
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {item.level ? <Badge tone="primary" label={item.level} /> : null}
              {hasContext ? <Badge label={`Schritt ${stepNumber} von 2`} /> : null}
            </View>
          </View>
          <ProgressBar value={sessionPercent(state, items.length)} label="Trainingsfortschritt" />
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
                  Wusstest du die Bedeutung?
                </AppText>
                <Button label="Gewusst" loading={submit.isPending} onPress={() => grade(true)} />
                <Button
                  label="Nicht gewusst"
                  variant="secondary"
                  disabled={submit.isPending}
                  onPress={() => grade(false)}
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

        {submit.error ? (
          <AppText color={colors.destructive} accessibilityRole="alert">
            {submit.error.message}
          </AppText>
        ) : null}

        {judged && state.round ? (
          <Card tone="accent" style={{ gap: spacing.sm }}>
            <AppText variant="subheading" accessibilityRole="alert">
              {state.round.flashcardCorrect ? '✓ Gewusst' : '✕ Nicht gewusst'}
              {state.round.contextCorrect === null
                ? ''
                : state.round.contextCorrect
                  ? ' · ✓ Kontext richtig'
                  : ' · ✕ Kontext nicht richtig'}
            </AppText>
            <Badge
              tone="primary"
              label={`Stufe: ${MASTERY_LABEL[state.round.progress.masteryLevel]}`}
            />
            <Button
              label={state.index + 1 >= items.length ? 'Ergebnis ansehen' : 'Weiter'}
              onPress={() => dispatch({ type: 'NEXT', total: items.length })}
            />
          </Card>
        ) : null}
      </View>
    );
  }

  return (
    <Screen>
      <Header title="Vocabulary" subtitle="Wortschatz trainieren" back />
      {body}
    </Screen>
  );
}
