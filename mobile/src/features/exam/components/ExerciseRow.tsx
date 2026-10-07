import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, ProgressRing } from '@/components/ui';
import { DirectionalIcon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { ExamExerciseSummary } from '@/types/exam';
import type { ExamExerciseLastTime } from '@/types/examTime';
import { effectiveScore } from '../examData';
import { useExamText } from '../examText';
import { formatClock } from '../time/examTime';
import { tint } from './kit';

type Props = {
  item: ExamExerciseSummary;
  onPress: () => void;
  onToggleBookmark: () => void;
  bookmarkBusy?: boolean;
  /** Last finished time, shown under the title. */
  lastTime?: ExamExerciseLastTime;
  /** Section accent (defaults to the app blue). */
  color?: string;
  /** Learning-path mode: the row sits on a vertical rail with its position number. */
  path?: { index: number; last: boolean };
  /** The exercise to do next: outlined in the accent colour. */
  next?: boolean;
};

const NODE = 40;

export function ExerciseRow({
  item,
  onPress,
  onToggleBookmark,
  bookmarkBusy,
  lastTime,
  color = colors.primary,
  path,
  next,
}: Props) {
  const { t } = useI18n();
  const tx = useExamText();
  const r = t.examHub.row;
  const mastered = effectiveScore(item) === 100;
  const retry = item.completed && !mastered;
  const sub = [
    item.questionsCount > 0 ? r.questions(item.questionsCount) : null,
    item.lastScore != null ? r.lastScore(Math.round(item.lastScore)) : null,
    lastTime
      ? r.lastTime(
          formatClock(lastTime.elapsedSeconds),
          lastTime.targetSeconds != null ? formatClock(lastTime.targetSeconds) : undefined,
        )
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const nodeColor = mastered
    ? color
    : retry
      ? colors.warning
      : next
        ? color
        : colors.mutedForeground;
  const node = (
    <View
      style={[
        styles.node,
        mastered
          ? { backgroundColor: color, borderColor: color }
          : { borderColor: nodeColor, backgroundColor: next ? tint(color, '1F') : colors.surface },
      ]}
    >
      {mastered ? (
        <Ionicons name="checkmark" size={22} color="#FFFFFF" />
      ) : path ? (
        <AppText style={{ fontWeight: '800', fontSize: 16 }} color={nodeColor}>
          {path.index}
        </AppText>
      ) : (
        <Ionicons name={retry ? 'refresh' : 'play'} size={16} color={nodeColor} />
      )}
    </View>
  );

  return (
    <View style={styles.row}>
      {path ? (
        <View style={styles.rail}>
          {node}
          {!path.last ? (
            <View style={[styles.line, { backgroundColor: mastered ? color : colors.border }]} />
          ) : null}
        </View>
      ) : null}
      <View
        style={[styles.card, next && { borderColor: color, backgroundColor: tint(color, '14') }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${tx(item.title)}${sub ? `, ${sub}` : ''}${item.completed ? `, ${r.done}` : ''}`}
          onPress={onPress}
          style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}
        >
          {!path ? node : null}
          <View style={{ flex: 1, gap: 2, alignItems: 'flex-start' }}>
            {next ? (
              <AppText variant="caption" color={color} style={{ fontWeight: '800' }}>
                {r.upNext}
              </AppText>
            ) : null}
            <AppText variant="subheading">{tx(item.title)}</AppText>
            {sub ? (
              <AppText variant="small" color={colors.mutedForeground}>
                {sub}
              </AppText>
            ) : null}
            {retry ? (
              <AppText variant="caption" color="#8A5A00" style={{ fontWeight: '700' }}>
                {r.retry}
              </AppText>
            ) : null}
          </View>
          {item.lastScore != null ? (
            <ProgressRing
              value={item.lastScore}
              size={50}
              stroke={5}
              textSize={10}
              color={mastered ? color : colors.warning}
              label={r.lastResult}
            />
          ) : (
            <DirectionalIcon name="chevron-forward" size={22} color={colors.mutedForeground} />
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.bookmarked ? r.unsave : r.save}
          accessibilityState={{ selected: item.bookmarked, busy: bookmarkBusy }}
          disabled={bookmarkBusy}
          onPress={onToggleBookmark}
          hitSlop={spacing.xs}
          style={styles.star}
        >
          <Ionicons
            name={item.bookmarked ? 'star' : 'star-outline'}
            size={22}
            color={item.bookmarked ? colors.warning : colors.mutedForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  rail: { width: NODE, alignItems: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Connects this node to the next one; fills the rest of the row, including the gap below the card.
  line: { flex: 1, width: 4, borderRadius: 2, marginVertical: 2 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    minHeight: MIN_TOUCH + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingStart: spacing.md,
  },
  star: {
    width: MIN_TOUCH - 4,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
