import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

type Props = { title: string; subtitle: string; children: ReactNode };

/** Shared frame for the three auth screens: keyboard-safe, calm, branded. */
export function AuthFrame({ title, subtitle, children }: Props) {
  return (
    <Screen keyboardAware>
      <View style={styles.header}>
        <AppText variant="caption" color={colors.primaryDark}>
          DEUTSCH BRIDGE
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color={colors.mutedForeground}>{subtitle}</AppText>
      </View>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.xs, marginTop: spacing.xl } });
