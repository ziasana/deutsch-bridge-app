import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
};

const palette: Record<Variant, { bg: string; pressed: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryDark, text: colors.primaryForeground },
  secondary: {
    bg: colors.surface,
    pressed: colors.accent,
    text: colors.primaryDark,
    border: colors.border,
  },
  ghost: { bg: 'transparent', pressed: colors.accent, text: colors.primaryDark },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  accessibilityHint,
}: Props) {
  const inactive = disabled || loading;
  const p = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? p.pressed : p.bg, borderColor: p.border ?? 'transparent' },
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.text} />
      ) : (
        <AppText variant="subheading" color={p.text}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

export const PrimaryCTA = (props: Omit<Props, 'variant'>) => (
  <Button {...props} variant="primary" />
);
export const SecondaryButton = (props: Omit<Props, 'variant'>) => (
  <Button {...props} variant="secondary" />
);

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { opacity: 0.55 },
});
