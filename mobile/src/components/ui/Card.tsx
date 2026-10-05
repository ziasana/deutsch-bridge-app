import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

type Props = { children: ReactNode; style?: ViewStyle; tone?: 'default' | 'accent' };

export function Card({ children, style, tone = 'default' }: Props) {
  return <View style={[styles.card, tone === 'accent' && styles.accent, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  accent: { backgroundColor: colors.accent, borderColor: colors.accent },
});
