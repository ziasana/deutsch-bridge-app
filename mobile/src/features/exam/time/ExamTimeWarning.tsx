import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import { stageToAnnounce, stagesUpTo, type WarningStage } from './examTime';
import { useExamTimerStore } from './timerStore';

type Props = {
  elapsedSeconds: number;
  targetSeconds: number;
  announced: WarningStage[];
  dismissed: WarningStage[];
};

/**
 * Each threshold message appears once, never repeated on a timer. What was shown lives in the
 * persisted timer, so a restart does not bring a closed message back. The exercise is never stopped.
 */
export function ExamTimeWarning({ elapsedSeconds, targetSeconds, announced, dismissed }: Props) {
  const { t } = useI18n();
  const tr = t.examRun.timer;
  const MESSAGES: Partial<Record<WarningStage, { title: string; body: string; over: boolean }>> = {
    TARGET_REACHED: { title: tr.warnReachedTitle, body: tr.warnReachedBody, over: false },
    OVER_TIME: { title: tr.warnOverTitle, body: tr.warnOverBody, over: true },
  };
  const markAnnounced = useExamTimerStore((s) => s.markAnnounced);
  const dismissWarning = useExamTimerStore((s) => s.dismissWarning);

  useEffect(() => {
    const stage = stageToAnnounce(elapsedSeconds, targetSeconds, announced);
    if (stage) markAnnounced(stagesUpTo(stage));
  }, [elapsedSeconds, targetSeconds, announced, markAnnounced]);

  // APPROACHING is only the quiet "noch N Min." line in the bar; the newest stage with a message wins.
  const shown = [...announced].reverse().find((s) => MESSAGES[s]) ?? null;
  const message = shown && !dismissed.includes(shown) ? MESSAGES[shown] : null;
  if (!shown || !message) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.box, message.over ? styles.over : styles.reached]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ fontWeight: '700' }}>{message.title}</AppText>
        <AppText variant="small">{message.body}</AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.dismiss}
        onPress={() => dismissWarning(shown)}
        hitSlop={spacing.sm}
      >
        <AppText>✕</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  reached: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
  over: { backgroundColor: colors.destructiveSoft, borderColor: colors.destructive },
});
