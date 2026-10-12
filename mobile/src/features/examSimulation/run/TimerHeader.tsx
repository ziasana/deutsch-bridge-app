import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { StageStatus } from '@/types/examSimulation';
import type { AutosaveStatus } from '../useExamAutosave';
import { formatClock } from '../format';

type Props = {
  color: string;
  stageLabel: string;
  stageIndex: number;
  stageCount: number;
  stages: StageStatus[];
  remainingSeconds: number;
  totalSeconds: number;
  autosave: AutosaveStatus;
  onMenu: () => void;
};

function SaveState({ status }: { status: AutosaveStatus }) {
  if (status === 'retrying')
    return (
      <View style={styles.save} accessibilityLiveRegion="assertive">
        <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
        <AppText variant="caption" color="#9A6402" style={{ fontWeight: '700' }}>
          Nicht gespeichert – neuer Versuch …
        </AppText>
      </View>
    );
  const text = status === 'saving' ? 'Speichert …' : status === 'saved' ? 'Gespeichert' : 'Automatisch gespeichert';
  return (
    <View style={styles.save} accessibilityLiveRegion="polite">
      <Ionicons name={status === 'saved' ? 'checkmark' : 'cloud-done-outline'} size={14} color={status === 'saved' ? '#1B7A55' : colors.mutedForeground} />
      <AppText variant="caption" color={status === 'saved' ? '#1B7A55' : colors.mutedForeground}>
        {text}
      </AppText>
    </View>
  );
}

/** Sticky exam header: section, the server-driven countdown with its draining bar, the section stepper and the autosave state. */
export function TimerHeader({ color, stageLabel, stageIndex, stageCount, stages, remainingSeconds, totalSeconds, autosave, onMenu }: Props) {
  const urgent = remainingSeconds <= 60;
  const warning = remainingSeconds <= 300;
  const tone = urgent ? colors.destructive : warning ? colors.warning : color;
  const left = totalSeconds > 0 ? Math.min(100, Math.max(0, (remainingSeconds / totalSeconds) * 100)) : 0;
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.row}>
        <View style={[styles.index, { backgroundColor: color }]}>
          <AppText color="#FFFFFF" style={{ fontWeight: '800' }}>
            {stageIndex + 1}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '600' }}>
            Abschnitt {stageIndex + 1} von {stageCount}
          </AppText>
          <AppText style={{ fontWeight: '800', color: colors.ink }} numberOfLines={1}>
            {stageLabel}
          </AppText>
        </View>
        <View
          accessibilityRole="timer"
          accessibilityLabel={`Verbleibende Zeit ${formatClock(remainingSeconds)}`}
          style={[styles.timer, { backgroundColor: `${tone}1F` }]}
        >
          <Ionicons name="timer-outline" size={18} color={tone} />
          <AppText style={[styles.clock, { color: tone }]}>{formatClock(remainingSeconds)}</AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Prüfung verlassen oder abgeben" onPress={onMenu} style={styles.menu}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.meta}>
        <View style={styles.steps} accessibilityLabel={`Abschnitt ${stageIndex + 1} von ${stageCount}`}>
          {stages.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.step,
                { backgroundColor: i === stageIndex ? color : i < stageIndex ? `${color}99` : colors.border },
                i === stageIndex && { flex: 2 },
              ]}
            />
          ))}
        </View>
        <SaveState status={autosave} />
      </View>
      <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.fill, { width: `${left}%`, backgroundColor: tone }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  index: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, height: 40, borderRadius: radius.pill },
  clock: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  menu: { width: MIN_TOUCH - 4, height: MIN_TOUCH - 4, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.muted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  steps: { flex: 1, flexDirection: 'row', gap: 4 },
  step: { flex: 1, height: 6, borderRadius: 3 },
  save: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  track: { height: 3, backgroundColor: colors.border },
  fill: { height: 3 },
});
