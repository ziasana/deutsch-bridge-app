import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { useI18n } from '@/i18n';
import { darken } from '@/features/exam/components/kit';
import { colors, spacing } from '@/theme';
import type { ExamSection } from '@/types/exam';
import { ExamTimeSummary } from './ExamTimeSummary';
import { useExamTimeConfiguration } from './hooks';
import { useExamTimerStore } from './timerStore';

type Props = {
  section: ExamSection;
  level: string;
  teil: number;
  showLastResult?: boolean;
  /** Section colour for the icon. */
  color?: string;
};

/** Recommended time per Übung and, once one was finished, the Zeit-Check of the most recent one. */
export function TeilTimeCard({ section, level, teil, showLastResult = true, color }: Props) {
  const { t } = useI18n();
  const { minutes } = useExamTimeConfiguration(level, section, teil);
  const lastResult = useExamTimerStore((s) => s.lastResult);
  const hasHydrated = useExamTimerStore((s) => s.hasHydrated);

  const result =
    showLastResult &&
    hasHydrated &&
    lastResult?.section === section &&
    lastResult.level === level &&
    lastResult.teil === teil
      ? lastResult
      : null;
  if (minutes == null && !result) return null;

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.head}>
        <Ionicons name="timer-outline" size={22} color={color ? darken(color) : colors.primaryDark} />
        <AppText variant="subheading">{t.examHub.timeCheck.title}</AppText>
      </View>
      {minutes != null ? (
        <AppText variant="small" color={colors.mutedForeground}>
          {t.examHub.timeCheck.recommended(minutes)}
        </AppText>
      ) : null}
      {result ? (
        <View style={styles.last}>
          <ExamTimeSummary result={result} />
          <AppText variant="caption" color={colors.mutedForeground}>
            {t.examHub.timeCheck.lastExercise}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  last: { gap: spacing.xs },
});
