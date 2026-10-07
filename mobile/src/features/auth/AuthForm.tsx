import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { HexLogo } from '@/components/brand/HexLogo';
import { AppText, DirectionalIcon, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Props = { title?: string; subtitle?: string; children: ReactNode };

// Static confetti around the logo: [left%, top%, size, colour].
const DOTS: [number, number, number, string][] = [
  [8, 10, 12, '#EBAFA0'],
  [88, 22, 14, '#363F63'],
  [2, 62, 10, '#DFE3E4'],
  [92, 70, 16, colors.primary],
  [70, 2, 8, '#DFE3E4'],
  [22, 80, 8, '#DFE3E4'],
];

/** Shared frame for the auth screens: back button, brand header, then the form. */
export function AuthFrame({ title, subtitle, children }: Props) {
  const { t } = useI18n();
  return (
    <Screen keyboardAware>
      {router.canGoBack() ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.entry.common.back}
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.back}
        >
          <DirectionalIcon name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
      ) : null}
      <View style={styles.brand}>
        <View style={styles.dots} pointerEvents="none">
          {DOTS.map(([left, top, size, color], i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
              }}
            />
          ))}
        </View>
        <HexLogo size={84} tone="dark" background="#FFFFFF" />
        <AppText style={styles.wordmark} color="#2A3238" accessibilityRole="header">
          Deutsch Bridge
        </AppText>
      </View>
      {title ? (
        <View style={styles.header}>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? <AppText color={colors.mutedForeground}>{subtitle}</AppText> : null}
        </View>
      ) : null}
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  brand: { alignItems: 'center', alignSelf: 'center', width: 280, paddingVertical: spacing.lg },
  // Confetti stays in the upper part so it never collides with the wordmark.
  dots: { position: 'absolute', left: 0, right: 0, top: 0, height: '60%' },
  wordmark: { fontSize: 32, lineHeight: 40, fontWeight: '600', letterSpacing: 0.3 },
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
