import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Card, ProgressBar } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { PracticeQuestion } from '../practice';

type Props = { questions: PracticeQuestion[]; onComplete: (score: number) => void };

export function PracticeQuiz({ questions, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const q = questions[index];
  if (!q) return null;
  const isLast = index === questions.length - 1;
  const answered = selected !== null;
  const correct = selected === q.answer;

  const choose = (option: string) => {
    if (answered) return;
    setSelected(option);
    if (option === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (isLast) {
      onComplete(score);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  return (
    <View style={styles.gap}>
      <View style={styles.gap}>
        <AppText variant="subheading">
          Frage {index + 1} von {questions.length}
        </AppText>
        <ProgressBar value={index + (answered ? 1 : 0)} max={questions.length} label="Quiz-Fortschritt" />
      </View>

      <Card style={styles.gap}>
        <AppText variant="small" color={colors.mutedForeground}>
          Welches Wort passt zu dieser Bedeutung?
        </AppText>
        <AppText variant="heading">{q.prompt}</AppText>
      </Card>

      <View style={styles.gap}>
        {q.options.map((option, i) => {
          const isAnswer = option === q.answer;
          const isPicked = option === selected;
          // Result is conveyed by an icon and text as well as color.
          const mark = answered ? (isAnswer ? '✓' : isPicked ? '✕' : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i);
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ selected: isPicked, disabled: answered }}
              disabled={answered}
              onPress={() => choose(option)}
              style={[
                styles.option,
                answered && isAnswer && styles.right,
                answered && isPicked && !isAnswer && styles.wrong,
              ]}
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

      {answered ? (
        <View style={styles.gap}>
          <AppText variant="subheading" color={correct ? '#1B7A55' : colors.destructive} accessibilityRole="alert">
            {correct ? '✓ Richtig!' : `✕ Nicht richtig – richtig ist „${q.answer}“.`}
          </AppText>
          <Button label={isLast ? 'Ergebnis ansehen' : 'Nächste Frage'} onPress={next} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
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
