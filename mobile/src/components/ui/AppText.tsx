import { createContext, useContext } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
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
  const base = [typography[variant], { color }, center && { textAlign: 'center' as const }, style];
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
