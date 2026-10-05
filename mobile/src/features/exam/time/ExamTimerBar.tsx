import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { TIME_THRESHOLDS, formatClock } from './examTime';
import { ExamTimeWarning } from './ExamTimeWarning';
import { useExamTimer } from './hooks';
import type { ActiveExamTimer } from './timerStore';

const DOT = { ON_TRACK: colors.success, TARGET_REACHED: colors.warning, OVER_TIME: colors.destructive };

function statusLabel(view: ReturnType<typeof useExamTimer>, mode: string) {
  if (view.isPaused) return { text: 'Pausiert' };
  if (mode === 'PRACTICE') return { text: 'Übungsmodus – ohne Zeitdruck' };
  if (!view.status) return { text: 'Zeitangaben sind für diese Übung nicht verfügbar.' };
  const { status, targetSeconds } = view.status;
  if (status === 'OVER_TIME') return { text: 'Über der empfohlenen Zeit', dot: DOT[status] };
  if (status === 'TARGET_REACHED') return { text: 'Empfohlene Zeit erreicht', dot: DOT[status] };
  if (view.elapsedSeconds >= targetSeconds * TIME_THRESHOLDS.approaching) {
    const left = Math.max(1, Math.ceil((targetSeconds - view.elapsedSeconds) / 60));
    return { text: `Noch ${left} Min.`, dot: DOT[status] };
  }
  return { text: 'Im Plan', dot: DOT[status] };
}

/** A quiet timer strip: elapsed time counts up, shown against the recommended time when there is one. */
export function ExamTimerBar({
  active,
  title,
  actions,
}: {
  active: ActiveExamTimer;
  title: string;
  actions?: ReactNode;
}) {
  const view = useExamTimer(active);
  const label = statusLabel(view, active.mode);

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={styles.row}>
        <AppText variant="subheading">{title}</AppText>
        <AppText
          style={styles.clock}
          accessibilityLabel={`Verstrichene Zeit ${formatClock(view.elapsedSeconds)}`}
        >
          {formatClock(view.elapsedSeconds)}
          {view.targetSeconds != null ? (
            <AppText color={colors.mutedForeground}> / {formatClock(view.targetSeconds)}</AppText>
          ) : null}
        </AppText>
      </View>
      <View style={styles.row}>
        <View style={styles.status}>
          {'dot' in label && label.dot ? <View style={[styles.dot, { backgroundColor: label.dot }]} /> : null}
          <AppText variant="small" color={colors.mutedForeground} style={{ flexShrink: 1 }}>
            {label.text}
          </AppText>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={view.isPaused ? 'Zeit fortsetzen' : 'Zeit pausieren'}
            onPress={view.isPaused ? view.resume : view.pause}
            style={styles.small}
          >
            <AppText variant="small" color={colors.primaryDark}>
              {view.isPaused ? '▶ Fortsetzen' : '❚❚ Pause'}
            </AppText>
          </Pressable>
          {actions}
        </View>
      </View>
      {view.targetSeconds != null && active.mode === 'TIME_TRAINING' && !view.isPaused ? (
        <ExamTimeWarning
          elapsedSeconds={view.elapsedSeconds}
          targetSeconds={view.targetSeconds}
          announced={active.announced}
          dismissed={active.dismissed}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  clock: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  small: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
