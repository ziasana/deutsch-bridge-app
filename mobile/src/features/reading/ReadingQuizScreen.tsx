import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LearningCelebration,
  ProgressBar,
  Screen,
  Skeleton,
  TextField,
} from '@/components/ui';
import { useReadingSessionStore } from '@/stores/readingSessionStore';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { AnswerFeedbackResponse, QuizQuestionPublic } from '@/types/reading';
import {
  useCompleteQuiz,
  useReadingArticle,
  useSaveToLexicon,
  useStartQuiz,
  useSubmitQuizAnswer,
} from './hooks';

type Attempt = { attemptId: string; questions: QuizQuestionPublic[] };

export function ReadingQuizScreen() {
  const router = useRouter();
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const article = useReadingArticle(articleId);
  const start = useStartQuiz();
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  // The attempt is created once per visit; "retry" starts it again after a failure.
  const begin = () => start.mutate(articleId, { onSuccess: (a) => setAttempt(a) });
  useEffect(() => {
    if (articleId) begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  let body;
  if (start.isError) {
    body = <ErrorState error={start.error} onRetry={begin} />;
  } else if (!attempt) {
    body = (
      <View accessibilityLabel="Quiz wird geladen" style={{ gap: spacing.md }}>
        <Skeleton height={8} />
        <Card style={{ gap: spacing.md }}>
          <Skeleton height={24} />
          <Skeleton height={48} />
        </Card>
      </View>
    );
  } else if (attempt.questions.length === 0) {
    body = <EmptyState emoji="📖" title="Noch kein Quiz" message="Zu diesem Text gibt es noch keine Fragen." actionLabel="Zurück zum Text" onAction={() => router.back()} />;
  } else {
    body = <QuizRunner key={attempt.attemptId} attempt={attempt} articleId={articleId} annotations={article.data?.annotations ?? []} />;
  }

  return (
    <Screen keyboardAware>
      <Header title="Quiz" subtitle={article.data?.title} back />
      {body}
    </Screen>
  );
}

function QuizRunner({
  attempt,
  articleId,
  annotations,
}: {
  attempt: Attempt;
  articleId: string;
  annotations: { lemma: string; type: 'WORD' | 'NOMEN_VERB_VERBINDUNG' | 'REDEWENDUNG'; exampleSentence: string | null; translationEn: string | null }[];
}) {
  const router = useRouter();
  const session = useReadingSessionStore();
  const submit = useSubmitQuizAnswer(attempt.attemptId);
  const complete = useCompleteQuiz(attempt.attemptId, articleId);
  const saveWord = useSaveToLexicon();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedbackResponse | null>(null);

  const q = attempt.questions[index];
  const isLast = index === attempt.questions.length - 1;
  const result = complete.data;

  const check = () => {
    if (!selected.trim() || submit.isPending) return;
    submit.mutate(
      { questionId: q.id, answer: selected },
      {
        onSuccess: (fb) => {
          setFeedback(fb);
          // The word this question tested goes to the learner's review list (like on web).
          const related = fb.relatedLemma ? annotations.find((a) => a.lemma === fb.relatedLemma) : null;
          if (related && !session.saved.includes(related.lemma)) {
            saveWord.mutate(
              { lemma: related.lemma, type: related.type, articleId, sentence: related.exampleSentence ?? '', translation: related.translationEn },
              { onSuccess: () => session.save(related.lemma) },
            );
          }
        },
      },
    );
  };

  const finish = () => complete.mutate({ tapped: session.tapped, saved: session.saved });

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
    setSelected('');
    setFeedback(null);
  };

  if (result) {
    const rec = result.recommendation;
    return (
      <View style={{ gap: spacing.md }}>
        <LearningCelebration
          title={result.comprehensionScore >= 80 ? 'Sehr gut!' : result.comprehensionScore >= 50 ? 'Gut gemacht!' : 'Weiter so!'}
          subtitle="Quiz abgeschlossen"
          progress={{ value: Math.round(result.comprehensionScore), max: 100 }}
          progressLabel={`Textverständnis ${Math.round(result.comprehensionScore)}% · Wortschatz im Kontext ${Math.round(result.vocabScore)}%`}
          primaryAction={{ label: 'Zurück zum Text', onPress: () => router.back() }}
        />
        <Card tone="accent" style={{ gap: spacing.sm }}>
          <AppText>{rec.message}</AppText>
          {rec.suggestedArticleId ? (
            <Button
              label={rec.suggestedTitle ? `Weiter: ${rec.suggestedTitle}` : 'Nächsten Text lesen'}
              variant="secondary"
              onPress={() => router.replace({ pathname: '/reading/[articleId]', params: { articleId: rec.suggestedArticleId! } })}
            />
          ) : null}
        </Card>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="subheading">
          Frage {index + 1} von {attempt.questions.length}
        </AppText>
        <ProgressBar value={index + (feedback ? 1 : 0)} max={attempt.questions.length} label="Quiz-Fortschritt" />
      </View>

      <AppText variant="heading">{q.prompt}</AppText>

      {q.options && q.options.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          {q.options.map((option, i) => {
            const picked = selected === option;
            const right = !!feedback && option === feedback.correctAnswer;
            const wrong = !!feedback && picked && !right;
            const mark = right ? '✓' : wrong ? '✕' : String.fromCharCode(65 + i);
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={option}
                accessibilityState={{ selected: picked, disabled: !!feedback }}
                disabled={!!feedback}
                onPress={() => setSelected(option)}
                style={[styles.option, !feedback && picked && styles.picked, right && styles.right, wrong && styles.wrong]}
              >
                <View style={styles.letter}>
                  <AppText variant="small" style={{ fontWeight: '700' }}>
                    {mark}
                  </AppText>
                </View>
                <AppText style={styles.optionText}>{option}</AppText>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <TextField label="Deine Antwort" value={selected} editable={!feedback} onChangeText={setSelected} autoCapitalize="none" />
      )}

      {submit.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {submit.error.message}
        </AppText>
      ) : null}

      {feedback ? (
        <Card tone="accent" style={{ gap: spacing.sm }}>
          <AppText variant="subheading" color={feedback.correct ? '#1B7A55' : colors.destructive} accessibilityRole="alert">
            {feedback.correct ? '✓ Richtig!' : '✕ Nicht richtig'}
          </AppText>
          {!feedback.correct ? <AppText>Richtig ist: {feedback.correctAnswer}</AppText> : null}
          {feedback.explanation ? <AppText>{feedback.explanation}</AppText> : null}
          {!feedback.correct && feedback.supportingSentence ? (
            <AppText style={{ fontStyle: 'italic' }}>„{feedback.supportingSentence}“</AppText>
          ) : null}
          {feedback.relatedLemma ? (
            <AppText variant="small" color={colors.mutedForeground}>
              „{feedback.relatedLemma}“ wurde zu deiner Wiederholung hinzugefügt.
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {complete.isError ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {complete.error.message}
        </AppText>
      ) : null}

      {feedback ? (
        <Button
          label={complete.isError ? 'Ergebnis erneut senden' : isLast ? 'Ergebnis ansehen' : 'Nächste Frage'}
          loading={complete.isPending}
          onPress={next}
        />
      ) : (
        <Button label="Antwort prüfen" loading={submit.isPending} disabled={!selected.trim()} onPress={check} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  picked: { borderColor: colors.primary, backgroundColor: colors.accent },
  right: { borderColor: colors.success, backgroundColor: colors.successSoft },
  wrong: { borderColor: colors.destructive, backgroundColor: colors.destructiveSoft },
  letter: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, fontSize: 17 },
});
