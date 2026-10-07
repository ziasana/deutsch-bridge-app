import { createContext, useContext } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useI18n } from '@/i18n';
import { hasRtlText } from '@/i18n/direction';
import { colors, typography } from '@/theme';

/**
 * Text size multiplier for every AppText below a provider (default 1: no effect). Lets a screen
 * offer a text size control without touching each text.
 */
export const AppTextScale = createContext(1);

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

export function AppText({
  variant = 'body',
  color = colors.foreground,
  center,
  style,
  ...rest
}: Props) {
  const scale = useContext(AppTextScale);
  const { isRTL } = useI18n();
  // Text does not follow the parent's `direction`, and React Native flips textAlign left/right
  // under an RTL layout, so alignment is driven by writingDirection instead: Persian text is
  // set right-to-left (and so aligns right), while German/Latin text stays untouched - forcing
  // rtl on it would scramble its punctuation. Pinned content overrides this through `style`.
  const base = [
    typography[variant],
    { color },
    isRTL && hasRtlText(rest.children) && { writingDirection: 'rtl' as const },
    center && { textAlign: 'center' as const },
    style,
  ];
  if (scale === 1) return <Text {...rest} style={base} />;
  const flat = StyleSheet.flatten(base) as { fontSize?: number; lineHeight?: number };
  const size = flat.fontSize ?? typography[variant].fontSize;
  const line = flat.lineHeight ?? Math.round(size * 1.4);
  return (
    <Text
      {...rest}
      style={[base, { fontSize: Math.round(size * scale), lineHeight: Math.round(line * scale) }]}
    />
  );
}
