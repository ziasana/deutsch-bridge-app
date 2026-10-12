import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { NO_AD_ANSWER, optionLabelFor } from '@/features/exam/content';
import { ChoiceField, type Choice } from '@/features/exam/components/ChoiceField';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { BODY_LINE, BODY_SIZE, scaledText, useExamTextScale } from '@/features/exam/textScale';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { ExamQuestionPublic, ExamTaskType } from '@/types/exam';
import type { ExercisePublic } from '@/types/examSimulation';
import { useScrollAnchors } from './scrollAnchors';

const TFN = [
  { value: 'RICHTIG', label: 'Richtig', icon: 'checkmark' as const },
  { value: 'FALSCH', label: 'Falsch', icon: 'close' as const },
  { value: 'NICHT_IM_TEXT', label: 'Nicht im Text', icon: 'remove' as const },
];

/** "+" / "-" of the listening pool read as words on the answer buttons. */
const SIGN_WORD: Record<string, string> = { '+': 'Richtig', '-': 'Falsch', '−': 'Falsch', R: 'Richtig', F: 'Falsch' };

export const questionType = (exercise: ExercisePublic, q: ExamQuestionPublic): ExamTaskType | null =>
  q.taskType ?? exercise.taskType;

type Props = {
  exercise: ExercisePublic;
  question: ExamQuestionPublic;
  number: number;
  value: string | null;
  flagged: boolean;
  disabled: boolean;
  color: string;
  /** Listening statements are judged with the exercise's sign pool (+ / -). */
  signPool?: boolean;
  onChange: (value: string | null) => void;
  onToggleFlag: () => void;
};

/**
 * Answer control of one question. It only shows the question and collects the choice - there is no feedback and no
 * correct answer anywhere on this screen; evaluation happens on the server after the exam.
 */
export function QuestionCard({ exercise, question, number, value, flagged, disabled, color, signPool, onChange, onToggleFlag }: Props) {
  const scale = useExamTextScale();
  const { register } = useScrollAnchors();
  const ref = useRef<View>(null);
  useEffect(() => {
    register(question.id, ref.current);
    return () => register(question.id, null);
  }, [register, question.id]);

  const type = questionType(exercise, question);
  const select = (next: string) => !disabled && onChange(value === next ? null : next);
  const label = `Aufgabe ${number}`;
  const body = scaledText(BODY_SIZE, BODY_LINE, scale);

  let control: React.ReactNode;
  if (signPool) {
    control = (
      <View style={styles.row} accessibilityRole="radiogroup">
        {(exercise.answerOptions ?? []).map((option) => {
          const picked = value === option;
          const word = SIGN_WORD[option.toUpperCase()] ?? SIGN_WORD[option];
          return (
            <PressableScale
              key={option}
              containerStyle={{ flex: 1 }}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${word ?? option}`}
              accessibilityState={{ selected: picked, disabled }}
              disabled={disabled}
              onPress={() => select(option)}
              style={[styles.pill, picked && { backgroundColor: color, borderColor: color }]}
            >
              <Ionicons
                name={word === 'Richtig' ? 'checkmark' : word ? 'close' : 'ellipse'}
                size={18}
                color={picked ? '#FFFFFF' : color}
              />
              <AppText style={styles.pillText} color={picked ? '#FFFFFF' : colors.ink}>
                {word ?? option}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    );
  } else if (type === 'TRUE_FALSE_NOT_GIVEN') {
    control = (
      <View style={styles.row} accessibilityRole="radiogroup">
        {TFN.map(({ value: v, label: text, icon }) => {
          const picked = value === v;
          return (
            <PressableScale
              key={v}
              containerStyle={{ flex: 1 }}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${text}`}
              accessibilityState={{ selected: picked, disabled }}
              disabled={disabled}
              onPress={() => select(v)}
              style={[styles.tfn, picked && { backgroundColor: color, borderColor: color }]}
            >
              <Ionicons name={icon} size={18} color={picked ? '#FFFFFF' : color} />
              <AppText style={styles.tfnText} color={picked ? '#FFFFFF' : colors.ink} center>
                {text}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    );
  } else if (type === 'MATCHING' || type === 'WORD_BANK_CLOZE') {
    const choices: Choice[] = (exercise.answerOptions ?? []).map((o, i) => ({
      value: o,
      label: `${optionLabelFor(exercise.answerOptionLabels, i)}) ${o}`,
    }));
    control = (
      <ChoiceField label={label} value={value ?? ''} choices={choices} color={color} disabled={disabled} onChange={(v) => onChange(v || null)} />
    );
  } else if (type === 'SITUATION_MATCHING') {
    control = (
      <View style={styles.adRow} accessibilityRole="radiogroup">
        {[...exercise.passages.map((p) => ({ value: p.id, text: p.label })), { value: NO_AD_ANSWER, text: 'x' }].map((c) => {
          const picked = value === c.value;
          return (
            <PressableScale
              key={c.value}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${c.value === NO_AD_ANSWER ? 'keine Anzeige' : c.text}`}
              accessibilityState={{ selected: picked, disabled }}
              disabled={disabled}
              onPress={() => select(c.value)}
              style={[styles.ad, picked && { backgroundColor: color, borderColor: color }]}
            >
              <AppText style={{ fontWeight: '800', fontSize: 17 }} color={picked ? '#FFFFFF' : colors.foreground}>
                {c.text}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    );
  } else {
    control = (
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {(question.options ?? []).map((o, i) => {
          const picked = value === o;
          return (
            <PressableScale
              key={`${i}-${o}`}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${o}`}
              accessibilityState={{ selected: picked, disabled }}
              disabled={disabled}
              onPress={() => select(o)}
              style={[styles.option, picked && { borderColor: color, backgroundColor: tint(color, '14') }]}
            >
              <View style={[styles.letter, { backgroundColor: picked ? color : colors.muted }]}>
                {picked ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <AppText variant="caption" style={{ fontWeight: '800' }} color={colors.mutedForeground}>
                    {String.fromCharCode(97 + i).toUpperCase()}
                  </AppText>
                )}
              </View>
              <AppText style={[{ flex: 1 }, body]}>{o}</AppText>
            </PressableScale>
          );
        })}
      </View>
    );
  }

  const prompt = question.prompt?.trim()
    ? question.prompt
    : question.gapNumber != null
      ? `Lücke ${question.gapNumber}`
      : `Frage ${number}`;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, flagged ? { borderColor: colors.warning } : value ? { borderColor: tint(color, '33') } : null]}
    >
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: value ? color : tint(color, '1F') }]}>
          {value ? (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          ) : (
            <AppText variant="small" style={{ fontWeight: '800' }} color={color}>
              {number}
            </AppText>
          )}
        </View>
        <AppText style={[styles.prompt, body]}>{prompt}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={flagged ? `${label}: Markierung entfernen` : `${label}: zur Überprüfung markieren`}
          accessibilityState={{ selected: flagged, disabled }}
          disabled={disabled}
          hitSlop={8}
          onPress={onToggleFlag}
          style={[styles.flag, flagged && { backgroundColor: colors.warningSoft }]}
        >
          <Ionicons name={flagged ? 'flag' : 'flag-outline'} size={20} color={flagged ? colors.warning : colors.mutedForeground} />
        </Pressable>
      </View>
      {control}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  badge: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  prompt: { flex: 1, fontWeight: '600', color: colors.ink, paddingTop: 3 },
  flag: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    minHeight: 52,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  pillText: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  tfn: {
    minHeight: 64,
    gap: 2,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tfnText: { fontSize: 13, lineHeight: 17, fontWeight: '700' },
  option: {
    minHeight: MIN_TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  letter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  adRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ad: {
    minWidth: MIN_TOUCH,
    height: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
