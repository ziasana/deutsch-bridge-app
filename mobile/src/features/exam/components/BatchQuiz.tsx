import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { ExamExercise, ExamQuestionPublic, StartExamAttemptResponse } from '@/types/exam';
import { NO_AD_ANSWER } from '../content';
import { useCompleteExamAttempt, useSubmitExamAnswer } from '../hooks';
import { ChoiceField, type Choice } from './ChoiceField';
import { PassageBody } from './Passages';
import type { ResultItem, ResultsState } from './Results';
import { optionsFor } from './StepQuiz';

export type BatchVariant = 'grid' | 'hoeren';

type Props = {
  variant: BatchVariant;
  exercise: ExamExercise;
  attempt: StartExamAttemptResponse;
  onFinish: (results: ResultsState) => void;
};

/**
 * Questions answered all at once, then submitted together: word-bank cloze and situation matching
 * ("grid") and Hörverstehen ("hoeren"). Nothing is revealed until everything is handed in, like the
 * real exam.
 */
export function BatchQuiz({ variant, exercise, attempt, onFinish }: Props) {
  const submit = useSubmitExamAnswer(attempt.attemptId);
  const complete = useCompleteExamAttempt(attempt.attemptId, exercise.id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSituation = exercise.taskType === 'SITUATION_MATCHING';

  const set = (id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value }));
  const allAnswered = attempt.questions.every((q) => answers[q.id]);

  const submitAll = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const items: ResultItem[] = [];
      for (const question of attempt.questions) {
        const feedback = await submit.mutateAsync({ questionId: question.id, answer: answers[question.id] ?? '' });
        items.push({ question, feedback });
      }
      const result = await complete.mutateAsync();
      onFinish({ score: result.score, items, transcripts: result.transcripts ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Übung konnte nicht abgeschlossen werden.');
      setBusy(false);
    }
  };

  const submitButton = (
    <View style={{ gap: spacing.sm }}>
      {error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Button
        label={error ? 'Erneut abgeben' : 'Antworten abgeben'}
        loading={busy}
        disabled={!allAnswered}
        onPress={() => void submitAll()}
      />
    </View>
  );

  if (variant === 'hoeren') {
    const pool = attempt.answerOptions ?? [];
    const showLabels = attempt.passages.length > 1;
    return (
      <View style={{ gap: spacing.lg }}>
        <Card style={{ gap: spacing.md }}>
          <AppText color={colors.mutedForeground}>
            Höre jeden Text an und markiere, ob die Aussage richtig ({pool[0] ?? '+'}) oder falsch (
            {pool[1] ?? '-'}) ist. Dein Ergebnis siehst du, sobald du alle Antworten abgegeben hast.
          </AppText>
          {attempt.passages.map((p) => (
            <View key={p.id} style={styles.clip}>
              <AppText variant="subheading">{p.label}</AppText>
              <PassageBody passage={p} />
            </View>
          ))}
        </Card>
        {attempt.questions.map((q, i) => {
          const passage = q.sectionIndex != null ? attempt.passages[q.sectionIndex] : null;
          return (
            <Card key={q.id} style={{ gap: spacing.md }}>
              <AppText variant="subheading">
                {q.questionNumber ?? i + 1}.{' '}
                {showLabels && passage ? `${passage.label}: ` : ''}
                {q.prompt}
              </AppText>
              <View style={styles.signs} accessibilityRole="radiogroup">
                {pool.map((option) => {
                  const picked = answers[q.id] === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityLabel={`Aufgabe ${q.questionNumber ?? i + 1}: ${option}`}
                      accessibilityState={{ selected: picked, disabled: busy }}
                      disabled={busy}
                      onPress={() => set(q.id, option)}
                      style={[styles.sign, picked && styles.signPicked]}
                    >
                      <AppText
                        style={{ fontWeight: '700', fontSize: 18 }}
                        color={picked ? colors.primaryForeground : colors.foreground}
                      >
                        {option}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          );
        })}
        {submitButton}
      </View>
    );
  }

  const choicesFor = (q: ExamQuestionPublic): Choice[] =>
    isSituation
      ? [
          // Each ad may be used once: disable it in every other situation once picked ("x" stays free).
          ...attempt.passages.map((p) => ({
            value: p.id,
            label: p.label,
            disabled: Object.entries(answers).some(([id, a]) => id !== q.id && a === p.id),
          })),
          { value: NO_AD_ANSWER, label: 'x (keine Anzeige)' },
        ]
      : optionsFor(q, exercise.taskType, attempt.answerOptions ?? [], attempt.answerOptionLabels);

  return (
    <View style={{ gap: spacing.lg }}>
      <AppText color={colors.mutedForeground}>
        Beantworte alle {attempt.questions.length} Aufgaben und tippe dann auf „Antworten abgeben“.
        {isSituation
          ? ' Jede Anzeige darf nur einmal benutzt werden. Wenn keine Anzeige passt, wähle x.'
          : ''}
      </AppText>
      {attempt.questions.map((q, i) => {
        // SITUATION_MATCHING's passages are the answer ads, not a text the question refers to.
        const ref = !isSituation && q.sectionIndex != null ? attempt.passages[q.sectionIndex] : null;
        const number = q.questionNumber ?? i + 1;
        return (
          <Card key={q.id} style={{ gap: spacing.sm }}>
            <AppText variant="subheading">
              {number}. {ref ? `${ref.label}: ` : ''}
              {q.prompt}
            </AppText>
            <ChoiceField
              label={`Aufgabe ${number}`}
              value={answers[q.id] ?? ''}
              choices={choicesFor(q)}
              disabled={busy}
              onChange={(v) => set(q.id, v)}
            />
          </Card>
        );
      })}
      {submitButton}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  signs: { flexDirection: 'row', gap: spacing.md },
  sign: {
    width: MIN_TOUCH + 8,
    height: MIN_TOUCH + 8,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signPicked: { backgroundColor: colors.primary, borderColor: colors.primary },
});
