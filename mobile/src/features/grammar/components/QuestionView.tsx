import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, TextField } from '@/components/ui';
import { InlineRich } from '@/components/content/RichContent';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { QuizQuestion } from '@/types/grammar';
import { isCorrectAnswer, localizedQuestion } from '../quiz';

type Props = {
  question: QuizQuestion;
  level: string;
  persian: boolean;
  selected: string;
  onSelect: (value: string) => void;
  submitted: boolean;
  onSubmitEditing?: () => void;
};

/** One quiz question: mcq, true/false or fill-in, with verdict feedback after submitting. */
export function QuestionView({
  question,
  level,
  persian,
  selected,
  onSelect,
  submitted,
  onSubmitEditing,
}: Props) {
  const { t } = useI18n();
  const g = t.grammar;
  const text = localizedQuestion(question, level, persian);
  const correct = submitted && isCorrectAnswer(question, selected);

  const choice = (value: string, label: React.ReactNode, mark: string, a11y: string) => {
    const isPicked = selected === value;
    const isRight = isCorrectAnswer(question, value);
    // After submitting: ✓ on the right option, ✕ on a wrong pick (icon + color, never color alone).
    const badge = submitted ? (isRight ? '✓' : isPicked ? '✕' : mark) : mark;
    return (
      <Pressable
        key={value}
        accessibilityRole="radio"
        accessibilityLabel={a11y}
        accessibilityState={{ selected: isPicked, disabled: submitted }}
        disabled={submitted}
        onPress={() => onSelect(value)}
        style={[
          styles.option,
          !submitted && isPicked && styles.picked,
          submitted && isRight && styles.right,
          submitted && isPicked && !isRight && styles.wrong,
        ]}
      >
        <View style={styles.letter}>
          <AppText variant="small" style={{ fontWeight: '700' }}>
            {badge}
          </AppText>
        </View>
        <View style={styles.flex}>{label}</View>
      </Pressable>
    );
  };

  return (
    <View style={styles.gap}>
      {text.title ? (
        <AppText variant="caption" color={colors.primaryDark}>
          {text.title.toUpperCase()}
        </AppText>
      ) : null}
      <InlineRich content={text.question} dir={text.dir} style={styles.question} />

      {question.type === 'mcq' ? (
        <View style={styles.gap}>
          {(question.options ?? []).map((option, i) =>
            choice(option, <InlineRich content={option} />, String.fromCharCode(65 + i), option),
          )}
        </View>
      ) : null}

      {question.type === 'truefalse' ? (
        <View style={styles.gap}>
          {choice('True', <AppText style={styles.optionText}>{g.true}</AppText>, 'A', g.true)}
          {choice('False', <AppText style={styles.optionText}>{g.false}</AppText>, 'B', g.false)}
        </View>
      ) : null}

      {question.type === 'fill' ? (
        <TextField
          label={g.yourAnswer}
          value={selected}
          editable={!submitted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onChangeText={onSelect}
          onSubmitEditing={onSubmitEditing}
          error={submitted && !correct ? g.notQuite : undefined}
        />
      ) : null}

      {submitted ? (
        <View
          style={[styles.feedback, correct ? styles.feedbackRight : styles.feedbackWrong]}
          accessibilityRole="alert"
        >
          <AppText variant="subheading" color={correct ? '#1B7A55' : colors.destructive}>
            {correct ? g.right : g.wrong}
          </AppText>
          {!correct ? (
            <View style={styles.row}>
              <AppText>{g.correctIs}</AppText>
              {typeof question.answer === 'boolean' ? (
                <AppText style={{ fontWeight: '700' }}>
                  {question.answer ? g.true : g.false}
                </AppText>
              ) : (
                <InlineRich content={question.answer} style={{ fontWeight: '700' }} />
              )}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  question: { fontSize: 19, lineHeight: 28, fontWeight: '600' },
  optionText: { fontSize: 17 },
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
    minWidth: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  feedback: { padding: spacing.md, borderRadius: radius.md, gap: spacing.xs },
  feedbackRight: { backgroundColor: colors.successSoft },
  feedbackWrong: { backgroundColor: colors.destructiveSoft },
});
