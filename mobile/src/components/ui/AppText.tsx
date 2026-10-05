import { Text, type TextProps } from 'react-native';
import { colors, typography } from '@/theme';

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

export function AppText({ variant = 'body', color = colors.foreground, center, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[typography[variant], { color }, center && { textAlign: 'center' }, style]}
    />
  );
}
