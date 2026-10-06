import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { Option } from './options';

type Props<T> = {
  option: Option<T>;
  selected: boolean;
  onPress: () => void;
  /** checkbox for multi-select steps, radio for single-select. */
  multi?: boolean;
  disabled?: boolean;
};

/** One selectable answer: icon, label, optional description, and a check/radio indicator. */
export function ChoiceCard<T>({ option, selected, onPress, multi, disabled }: Props<T>) {
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityLabel={option.label}
      accessibilityHint={option.description}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {option.icon ? (
        <View style={[styles.icon, selected && { backgroundColor: colors.primary }]}>
          <Ionicons
            name={option.icon}
            size={22}
            color={selected ? '#FFFFFF' : colors.primaryDark}
          />
        </View>
      ) : null}
      <View style={styles.text}>
        <AppText variant="subheading" color={colors.ink}>
          {option.label}
        </AppText>
        {option.description ? (
          <AppText variant="small" color={colors.mutedForeground}>
            {option.description}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.mark, multi && styles.markSquare, selected && styles.markOn]}>
        {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: MIN_TOUCH + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primaryDark, backgroundColor: colors.accent },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSquare: { borderRadius: 7 },
  markOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
});
