import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, ProgressBar } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { isCorrectAnswer, type RunnerQuestion } from '../quiz';
import { QuestionView } from './QuestionView';

type Props = {
  questions: RunnerQuestion[];
  persian: boolean;
  /** Resume point (e.g. first unanswered question). */
  startIndex?: number;
  /** Correct answers already given before `startIndex`. */
  initialCorrect?: number;
  onAnswered?: (question: RunnerQuestion, correct: boolean) => void;
  /** Called after the last question with the final number of correct answers. */
  onFinish: (correct: number) => void;
};

/** Runs questions one at a time: answer → submit → feedback → next. Shared by lesson quiz and category test. */
export function QuizRunner({
  questions,
  persian,
  startIndex = 0,
  initialCorrect = 0,
  onAnswered,
  onFinish,
}: Props) {
  const [index, setIndex] = useState(startIndex);
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(initialCorrect);

  const current = questions[index];
  if (!current) return null;
  const isLast = index === questions.length - 1;

  const submit = () => {
    if (submitted || !selected.trim()) return;
    const right = isCorrectAnswer(current.question, selected);
    setSubmitted(true);
    if (right) setCorrectCount((c) => c + 1);
    onAnswered?.(current, right);
  };

  const next = () => {
    if (isLast) {
      onFinish(correctCount);
      return;
    }
    setIndex((i) => i + 1);
    setSelected('');
    setSubmitted(false);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="subheading">
          Frage {index + 1} von {questions.length}
        </AppText>
        <ProgressBar
          value={index + (submitted ? 1 : 0)}
          max={questions.length}
          label="Quiz-Fortschritt"
        />
      </View>

      <QuestionView
        key={`${current.lessonId}:${current.index}:${index}`}
        question={current.question}
        level={current.level}
        persian={persian}
        selected={selected}
        onSelect={setSelected}
        submitted={submitted}
        onSubmitEditing={submit}
      />

      {submitted ? (
        <Button label={isLast ? 'Ergebnis ansehen' : 'Nächste Frage'} onPress={next} />
      ) : (
        <>
          <Button label="Antwort prüfen" disabled={!selected.trim()} onPress={submit} />
          {!selected.trim() ? (
            <AppText variant="small" color={colors.mutedForeground} center>
              Wähle oder tippe eine Antwort.
            </AppText>
          ) : null}
        </>
      )}
    </View>
  );
}
