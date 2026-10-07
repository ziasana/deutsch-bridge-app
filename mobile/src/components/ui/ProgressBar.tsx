import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

type Props = { value: number; max?: number; label?: string; color?: string };

export function ProgressBar({ value, max = 100, label = 'Fortschritt', color }: Props) {
  const percent = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent} Prozent` }}
      style={styles.track}
    >
      <View
        style={[styles.fill, { width: `${percent}%` }, color ? { backgroundColor: color } : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
});
