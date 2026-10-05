import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge } from '@/components/ui';
import { MIN_TOUCH, colors, spacing } from '@/theme';
import type { ExamExerciseSummary } from '@/types/exam';
import type { ExamExerciseLastTime } from '@/types/examTime';
import { formatClock } from '../time/examTime';

type Props = {
  item: ExamExerciseSummary;
  onPress: () => void;
  onToggleBookmark: () => void;
  bookmarkBusy?: boolean;
  /** Last finished time, shown under the title. */
  lastTime?: ExamExerciseLastTime;
};

export function ExerciseRow({ item, onPress, onToggleBookmark, bookmarkBusy, lastTime }: Props) {
  const retry = item.completed && item.lastScore != null && item.lastScore < 100;
  const sub = [
    item.questionsCount > 0 ? `${item.questionsCount} ${item.questionsCount === 1 ? 'Frage' : 'Fragen'}` : null,
    item.lastScore != null ? `Letztes Ergebnis ${Math.round(item.lastScore)}%` : null,
    lastTime
      ? `Letzte Zeit ${formatClock(lastTime.elapsedSeconds)}${lastTime.targetSeconds != null ? ` von ${formatClock(lastTime.targetSeconds)}` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}${sub ? `, ${sub}` : ''}${item.completed ? ', erledigt' : ''}`}
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && { backgroundColor: colors.accent }]}
      >
        <AppText style={styles.state} color={item.completed ? colors.success : colors.mutedForeground}>
          {item.completed ? '✓' : '○'}
        </AppText>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="subheading">{item.title}</AppText>
          {sub ? (
            <AppText variant="small" color={colors.mutedForeground}>
              {sub}
            </AppText>
          ) : null}
        </View>
        {item.completed ? (
          <Badge tone={retry ? 'warning' : 'success'} label={retry ? 'Wiederholen' : 'Erledigt'} />
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.bookmarked ? 'Merkzeichen entfernen' : 'Aufgabe merken'}
        accessibilityState={{ selected: item.bookmarked, busy: bookmarkBusy }}
        disabled={bookmarkBusy}
        onPress={onToggleBookmark}
        hitSlop={spacing.xs}
        style={styles.star}
      >
        <AppText style={{ fontSize: 22 }} color={item.bookmarked ? colors.warning : colors.mutedForeground}>
          {item.bookmarked ? '★' : '☆'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  main: {
    flex: 1,
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  state: { width: 24, fontSize: 20, textAlign: 'center' },
  star: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
});
