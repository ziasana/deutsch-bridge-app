import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Card, ProgressBar } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type {
  ExamAnswerFeedback,
  ExamExercise,
  ExamQuestionPublic,
  StartExamAttemptResponse,
} from '@/types/exam';
import { optionLabelFor } from '../content';
import { TFN_OPTIONS } from '../examMeta';
import { useCompleteExamAttempt, useSubmitExamAnswer } from '../hooks';
import { PassageBody } from './Passages';
import { FeedbackCard, type ResultItem, type ResultsState } from './Results';

type Option = { value: string; label: string };

export function optionsFor(
  question: ExamQuestionPublic,
  taskType: string | null,
  answerOptions: string[],
  labels: string[] | null,
): Option[] {
  if (taskType === 'TRUE_FALSE_NOT_GIVEN') return TFN_OPTIONS;
  if (taskType === 'MATCHING' || taskType === 'WORD_BANK_CLOZE') {
    return answerOptions.map((o, i) => ({ value: o, label: `${optionLabelFor(labels, i)}) ${o}` }));
  }
  return (question.options ?? []).map((o) => ({ value: o, label: o }));
}

type Props = {
  exercise: ExamExercise;
  attempt: StartExamAttemptResponse;
  onFinish: (results: ResultsState) => void;
};

/** One question at a time with immediate feedback, then the overall score. */
export function StepQuiz({ exercise, attempt, onFinish }: Props) {
  const submit = useSubmitExamAnswer(attempt.attemptId);
  const complete = useCompleteExamAttempt(attempt.attemptId, exercise.id);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [feedback, setFeedback] = useState<ExamAnswerFeedback | null>(null);
  const [items, setItems] = useState<ResultItem[]>([]);

  const total = attempt.questions.length;
  const question = attempt.questions[index];
  const isLast = index + 1 >= total;
  const passage =
    exercise.taskType === 'MATCHING' && question.sectionIndex != null
      ? attempt.passages[question.sectionIndex]
      : null;
  const options = optionsFor(question, exercise.taskType, attempt.answerOptions ?? [], attempt.answerOptionLabels);

  const check = () => {
    if (!selected || submit.isPending) return;
    submit.mutate(
      { questionId: question.id, answer: selected },
      {
        onSuccess: (fb) => {
          setFeedback(fb);
          setItems((prev) => [...prev, { question, feedback: fb }]);
        },
      },
    );
  };

  const finish = () =>
    complete.mutate(undefined, {
      onSuccess: (r) => onFinish({ score: r.score, items, transcripts: r.transcripts ?? [] }),
    });

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setIndex(index + 1);
    setSelected('');
    setFeedback(null);
  };

  const number = question.questionNumber;
  const heading =
    number != null && number !== index + 1
      ? `Aufgabe ${number} (${index + 1} von ${total})`
      : `Aufgabe ${index + 1} von ${total}`;

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="subheading">
          {heading}
          {passage ? ` — ${passage.label}` : ''}
        </AppText>
        <ProgressBar value={index + (feedback ? 1 : 0)} max={total} label="Fortschritt der Übung" />
      </View>

      {passage ? (
        <Card tone="accent" style={{ gap: spacing.sm }}>
          <AppText variant="subheading">{passage.label}</AppText>
          <PassageBody passage={passage} />
        </Card>
      ) : null}

      {question.prompt ? <AppText variant="heading">{question.prompt}</AppText> : null}

      <View style={{ gap: spacing.md }} accessibilityRole="radiogroup">
        {options.map((option, i) => {
          const picked = selected === option.value;
          const right = !!feedback && option.value === feedback.correctAnswer;
          const wrong = !!feedback && picked && !right;
          return (
            <Pressable
              key={`${i}-${option.value}`}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: picked, disabled: !!feedback }}
              disabled={!!feedback}
              onPress={() => setSelected(option.value)}
              style={[styles.option, !feedback && picked && styles.picked, right && styles.right, wrong && styles.wrong]}
            >
              <View style={styles.letter}>
                <AppText variant="small" style={{ fontWeight: '700' }}>
                  {right ? '✓' : wrong ? '✕' : String.fromCharCode(65 + i)}
                </AppText>
              </View>
              <AppText style={styles.optionText}>{option.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      {submit.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {submit.error.message}
        </AppText>
      ) : null}
      {feedback ? <FeedbackCard feedback={feedback} /> : null}
      {complete.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {complete.error.message}
        </AppText>
      ) : null}

      {feedback ? (
        <Button
          label={complete.isError ? 'Ergebnis erneut senden' : isLast ? 'Ergebnis anzeigen' : 'Nächste Aufgabe'}
          loading={complete.isPending}
          onPress={next}
        />
      ) : (
        <Button label="Antwort prüfen" loading={submit.isPending} disabled={!selected} onPress={check} />
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
  letter: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, fontSize: 17 },
});
