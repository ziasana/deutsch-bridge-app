import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Screen } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Props = { title: string; subtitle: string; children: ReactNode };

/** Shared frame for the three auth screens: keyboard-safe, calm, branded. */
export function AuthFrame({ title, subtitle, children }: Props) {
  return (
    <Screen keyboardAware>
      {router.canGoBack() ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zurück"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
      ) : null}
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

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginTop: spacing.md },
  back: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
