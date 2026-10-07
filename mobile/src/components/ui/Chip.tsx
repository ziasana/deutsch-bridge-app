import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Props = { label: string; selected?: boolean; onPress?: () => void; color?: string };

export function Chip({ label, selected, onPress, color }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.selected,
        selected && color ? { backgroundColor: color, borderColor: color } : null,
      ]}
    >
      <AppText variant="small" color={selected ? colors.primaryForeground : colors.foreground}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
});
