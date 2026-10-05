import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { PracticeContextQuestion } from '@/types/vocabulary';

type Props = {
  question: PracticeContextQuestion;
  selectedKey: string | null;
  /** Set once the server has judged the round. */
  correctKey: string | null;
  busy: boolean;
  onSelect: (key: string) => void;
};

export function ContextQuestion({ question, selectedKey, correctKey, busy, onSelect }: Props) {
  const judged = correctKey !== null;
  return (
    <View style={styles.gap}>
      <Card style={styles.gap}>
        <AppText variant="caption" color={colors.primaryDark}>
          {question.isCloze ? 'LÜCKENTEXT' : 'KONTEXT'}
        </AppText>
        <AppText variant="heading">{question.prompt}</AppText>
      </Card>
      {question.options.map((o, i) => {
        const isRight = judged && o.key === correctKey;
        const isWrongPick = judged && o.key === selectedKey && o.key !== correctKey;
        const mark = isRight ? '✓' : isWrongPick ? '✕' : String.fromCharCode(65 + i);
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityLabel={o.text}
            accessibilityState={{ selected: o.key === selectedKey, disabled: judged || busy }}
            disabled={judged || busy}
            onPress={() => onSelect(o.key)}
            style={[
              styles.option,
              o.key === selectedKey && !judged && styles.picked,
              isRight && styles.right,
              isWrongPick && styles.wrong,
            ]}
          >
            <View style={styles.letter}>
              <AppText variant="small" style={{ fontWeight: '700' }}>
                {mark}
              </AppText>
            </View>
            <AppText style={styles.text}>{o.text}</AppText>
          </Pressable>
        );
      })}
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
  text: { flex: 1, fontSize: 17 },
});
