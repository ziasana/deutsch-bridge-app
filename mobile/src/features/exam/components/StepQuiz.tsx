import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type {
  ExamAnswerFeedback,
  ExamExercise,
  ExamQuestionPublic,
  StartExamAttemptResponse,
} from '@/types/exam';
import { optionLabelFor } from '../content';
import { SECTION_META, TFN_OPTIONS } from '../examMeta';
import { BODY_LINE, BODY_SIZE, scaledText, useExamTextScale } from '../textScale';
import { useCompleteExamAttempt, useSubmitExamAnswer } from '../hooks';
import { FeedbackPanel } from './FeedbackPanel';
import {
  ExerciseFrame,
  PressableScale,
  SegmentedProgress,
  TextSizeControl,
  tint,
  type SegmentState,
} from './kit';
import { ReadingCard } from './Passages';
import type { ResultItem, ResultsState } from './Results';
import { darken } from '@/features/exam/components/kit';

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

const TFN_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  RICHTIG: 'checkmark',
  FALSCH: 'close',
  NICHT_IM_TEXT: 'help',
};

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
  const color = SECTION_META[exercise.section].color;
  const scale = useExamTextScale();

  const total = attempt.questions.length;
  const question = attempt.questions[index];
  const isLast = index + 1 >= total;
  const matched =
    exercise.taskType === 'MATCHING' && question.sectionIndex != null
      ? attempt.passages[question.sectionIndex]
      : null;
  // Matching shows the text of the current question; every other task shares one text (or none).
  const shownPassages = matched ? [matched] : exercise.taskType === 'MATCHING' ? [] : attempt.passages;
  const options = optionsFor(question, exercise.taskType, attempt.answerOptions ?? [], attempt.answerOptionLabels);

  const states: SegmentState[] = attempt.questions.map((_, i) => {
    const r = items[i];
    return r ? (r.feedback.correct ? 'correct' : 'wrong') : undefined;
  });
  const rightSoFar = items.filter((i) => i.feedback.correct).length;

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

  const footer = (
    <>
      {feedback ? <FeedbackPanel key={question.id} feedback={feedback} /> : null}
      {submit.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {submit.error.message}
        </AppText>
      ) : null}
      {complete.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {complete.error.message}
        </AppText>
      ) : null}
      {feedback ? (
        <Button
          pill
          label={complete.isError ? 'Ergebnis erneut senden' : isLast ? 'Ergebnis anzeigen' : 'Nächste Aufgabe'}
          loading={complete.isPending}
          onPress={next}
          color={color}
        />
      ) : (
        <Button pill label="Antwort prüfen" loading={submit.isPending} disabled={!selected} onPress={check} color={color} />
      )}
    </>
  );

  return (
    <ExerciseFrame
      footer={footer}
      footerTone={feedback ? (feedback.correct ? 'success' : 'danger') : undefined}
      scrollToEndKey={feedback ? question.id : null}
      scrollTopKey={question.id}
      header={
        <>
          <SegmentedProgress total={total} current={index} states={states} color={color} />
          <View style={styles.headRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="small" style={{ fontWeight: '700' }} color={colors.ink}>
                {heading}
                {matched ? ` — ${matched.label}` : ''}
              </AppText>
              {rightSoFar > 0 ? <Badge tone="success" label={`✓ ${rightSoFar} richtig`} /> : null}
            </View>
            <TextSizeControl color={color} />
          </View>
        </>
      }
    >
      {shownPassages.length > 0 ? (
        <ReadingCard
          key={matched?.id ?? 'shared'}
          passages={shownPassages}
          title={matched ? matched.label : undefined}
          color={color}
        />
      ) : null}

      {question.gapNumber != null ? (
        <View style={[styles.gap, { backgroundColor: tint(color, '1F') }]}>
          <AppText variant="small" color={color} style={{ fontWeight: '800' }}>
            Lücke {question.gapNumber}
          </AppText>
        </View>
      ) : null}
      {question.prompt ? (
        <AppText style={[scaledText(BODY_SIZE, BODY_LINE, scale), styles.prompt]}>
          {question.prompt}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.md }} accessibilityRole="radiogroup">
        {options.map((option, i) => {
          const picked = selected === option.value;
          const right = !!feedback && option.value === feedback.correctAnswer;
          const wrong = !!feedback && picked && !right;
          const tfn = exercise.taskType === 'TRUE_FALSE_NOT_GIVEN' ? TFN_ICON[option.value] : undefined;
          return (
            <PressableScale
              key={`${i}-${option.value}`}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: picked, disabled: !!feedback }}
              disabled={!!feedback}
              onPress={() => setSelected(option.value)}
              style={[
                styles.option,
                !feedback && picked && { borderColor: color, backgroundColor: tint(color, '14') },
                right && styles.right,
                wrong && styles.wrong,
              ]}
            >
              <View
                style={[
                  styles.letter,
                  !feedback && picked && { backgroundColor: color },
                  right && { backgroundColor: colors.success },
                  wrong && { backgroundColor: colors.destructive },
                ]}
              >
                {right || wrong ? (
                  <Ionicons name={right ? 'checkmark' : 'close'} size={20} color="#FFFFFF" />
                ) : tfn ? (
                  <Ionicons name={tfn} size={20} color={picked ? '#FFFFFF' : colors.mutedForeground} />
                ) : (
                  <AppText
                    variant="small"
                    style={{ fontWeight: '800' }}
                    color={picked ? '#FFFFFF' : colors.mutedForeground}
                  >
                    {String.fromCharCode(65 + i)}
                  </AppText>
                )}
              </View>
              <AppText style={[styles.optionText, scaledText(BODY_SIZE, BODY_LINE, scale)]}>{option.label}</AppText>
            </PressableScale>
          );
        })}
      </View>
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  gap: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  option: {
    minHeight: MIN_TOUCH + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  right: { borderColor: colors.success, backgroundColor: colors.successSoft },
  wrong: { borderColor: colors.destructive, backgroundColor: colors.destructiveSoft },
  letter: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  prompt: { fontWeight: '700', color: colors.ink },
});
