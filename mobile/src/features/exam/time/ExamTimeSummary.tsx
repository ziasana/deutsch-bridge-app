import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ExamPracticeSessionResult } from '@/types/examTime';
import { formatClock, shortGap } from './examTime';

/** "Zeit-Check": your time as the headline, the recommended time and the difference underneath. */
export function ExamTimeSummary({ result }: { result: ExamPracticeSessionResult }) {
  const { targetSeconds, differenceSeconds } = result;
  const hasTarget = targetSeconds != null && differenceSeconds != null;
  const within = hasTarget && differenceSeconds <= 0;
  const tone = !hasTarget ? styles.plain : within ? styles.within : styles.over;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Zeit-Check: ${formatClock(result.elapsedSeconds)}`}
      style={[styles.box, tone]}
    >
      <AppText variant="caption" color={colors.mutedForeground}>
        ⏱ ZEIT-CHECK
      </AppText>
      <AppText style={styles.big}>{formatClock(result.elapsedSeconds)}</AppText>
      {hasTarget ? (
        <>
          <AppText color={colors.mutedForeground}>von {formatClock(targetSeconds)} empfohlen</AppText>
          <AppText style={{ fontWeight: '700' }}>
            {within
              ? differenceSeconds === 0
                ? '✓ Genau in der Vorgabe'
                : `✓ ${shortGap(differenceSeconds)} unter der Vorgabe`
              : `⚠ ${shortGap(differenceSeconds)} länger als empfohlen`}
          </AppText>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.lg },
  within: { backgroundColor: colors.successSoft },
  over: { backgroundColor: colors.warningSoft },
  plain: { backgroundColor: colors.accent },
  big: { fontSize: 26, lineHeight: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
