import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ExamSection } from '@/types/exam';
import { ExamTimeSummary } from './ExamTimeSummary';
import { useExamTimeConfiguration } from './hooks';
import { useExamTimerStore } from './timerStore';

type Props = { section: ExamSection; level: string; teil: number; showLastResult?: boolean };

/** Recommended time per Übung and, once one was finished, the Zeit-Check of the most recent one. */
export function TeilTimeCard({ section, level, teil, showLastResult = true }: Props) {
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
      <AppText variant="subheading">Zeit-Check</AppText>
      {minutes != null ? (
        <AppText color={colors.mutedForeground}>
          Empfohlene Zeit pro Übung: {minutes} Min. Die Zeit startet automatisch, sobald du eine Übung öffnest.
        </AppText>
      ) : null}
      {result ? (
        <View style={styles.last}>
          <ExamTimeSummary result={result} />
          <AppText variant="caption" color={colors.mutedForeground}>
            Letzte Übung
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({ last: { gap: spacing.xs } });
