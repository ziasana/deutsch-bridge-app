import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { useI18n } from '@/i18n';
import type { Dictionary } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { TIME_THRESHOLDS, formatClock } from './examTime';
import { ExamTimeWarning } from './ExamTimeWarning';
import { useExamTimer } from './hooks';
import type { ActiveExamTimer } from './timerStore';

const DOT = {
  ON_TRACK: colors.success,
  TARGET_REACHED: colors.warning,
  OVER_TIME: colors.destructive,
};

function statusLabel(
  view: ReturnType<typeof useExamTimer>,
  mode: string,
  tr: Dictionary['examRun']['timer'],
) {
  if (view.isPaused) return { text: tr.paused };
  if (mode === 'PRACTICE') return { text: tr.practice };
  if (!view.status) return { text: tr.unavailable };
  const { status, targetSeconds } = view.status;
  if (status === 'OVER_TIME') return { text: tr.over, dot: DOT[status] };
  if (status === 'TARGET_REACHED') return { text: tr.reached, dot: DOT[status] };
  if (view.elapsedSeconds >= targetSeconds * TIME_THRESHOLDS.approaching) {
    const left = Math.max(1, Math.ceil((targetSeconds - view.elapsedSeconds) / 60));
    return { text: tr.left(left), dot: DOT[status] };
  }
  return { text: tr.onTrack, dot: DOT[status] };
}

/** Small outlined action in the timer strip (pause / resume / stop). */
export function TimerPill({
  label,
  text,
  onPress,
  busy,
}: {
  label: string;
  text: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy }}
      disabled={busy}
      onPress={onPress}
      style={[styles.small, busy && { opacity: 0.5 }]}
    >
      <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '600' }}>
        {text}
      </AppText>
    </Pressable>
  );
}

/** A slim timer strip: elapsed time counts up against the recommended time, with a thin progress line. */
export function ExamTimerBar({
  active,
  title,
  actions,
}: {
  active: ActiveExamTimer;
  title: string;
  actions?: ReactNode;
}) {
  const { t } = useI18n();
  const tr = t.examRun.timer;
  const view = useExamTimer(active);
  const label = statusLabel(view, active.mode, tr);
  const dot = 'dot' in label ? label.dot : undefined;
  const ratio = view.targetSeconds ? Math.min(1, view.elapsedSeconds / view.targetSeconds) : 0;

  return (
    <View style={styles.strip}>
      <View style={styles.row}>
        <AppText
          style={styles.clock}
          accessibilityLabel={tr.elapsed(formatClock(view.elapsedSeconds))}
        >
          {formatClock(view.elapsedSeconds)}
          {view.targetSeconds != null ? (
            <AppText color={colors.mutedForeground}> / {formatClock(view.targetSeconds)}</AppText>
          ) : null}
        </AppText>
        <View style={styles.actions}>
          <TimerPill
            label={view.isPaused ? tr.resumeLabel : tr.pauseLabel}
            text={view.isPaused ? tr.resume : tr.pause}
            onPress={view.isPaused ? view.resume : view.pause}
          />
          {actions}
        </View>
      </View>
      <View style={styles.status}>
        <AppText variant="caption" color={colors.mutedForeground}>
          {title}
        </AppText>
        {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
        <AppText variant="caption" color={colors.mutedForeground} style={{ flexShrink: 1 }}>
          {label.text}
        </AppText>
      </View>
      {view.targetSeconds != null ? (
        <View style={styles.line}>
          <View
            style={[
              styles.lineFill,
              { width: `${ratio * 100}%`, backgroundColor: dot ?? colors.primary },
            ]}
          />
        </View>
      ) : null}
      {view.targetSeconds != null && active.mode === 'TIME_TRAINING' && !view.isPaused ? (
        <ExamTimeWarning
          elapsedSeconds={view.elapsedSeconds}
          targetSeconds={view.targetSeconds}
          announced={active.announced}
          dismissed={active.dismissed}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  clock: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: colors.ink,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: 2 },
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
  line: {
    height: 3,
    marginBottom: 2,
    borderRadius: 2,
    backgroundColor: colors.muted,
    overflow: 'hidden',
  },
  lineFill: { height: '100%', borderRadius: 2 },
});
