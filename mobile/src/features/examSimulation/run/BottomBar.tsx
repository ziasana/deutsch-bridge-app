import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, ProgressBar } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Props = {
  color: string;
  answered: number;
  total: number;
  prevLabel: string | null;
  nextLabel: string | null;
  busy: boolean;
  onOverview: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
};

/** Pinned bottom bar: how much of the section is answered, the overview, and the way on (next part, or finish). */
export function BottomBar({ color, answered, total, prevLabel, nextLabel, busy, onOverview, onPrev, onNext, onFinish }: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.progress}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={answered} max={total} color={color} label="Beantwortete Fragen" />
        </View>
        <AppText variant="caption" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }} color={colors.mutedForeground}>
          {answered}/{total} beantwortet
        </AppText>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fragenübersicht" onPress={onOverview} style={styles.icon}>
          <Ionicons name="grid-outline" size={22} color={colors.ink} />
        </Pressable>
        {prevLabel ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Zurück zu ${prevLabel}`} onPress={onPrev} style={styles.icon}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          {nextLabel ? (
            <Button pill color={color} label={`Weiter: ${nextLabel}`} onPress={onNext} />
          ) : (
            <Button pill color={color} label="Abschließen" loading={busy} onPress={onFinish} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  progress: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  icon: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
});
