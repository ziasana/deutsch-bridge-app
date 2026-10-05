import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  /** Adds a show/hide toggle and masks input. */
  secret?: boolean;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, secret, ...input },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      <AppText variant="small" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secret && hidden}
          style={styles.input}
          {...input}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Passwort anzeigen' : 'Passwort verbergen'}
            onPress={() => setHidden((h) => !h)}
            style={styles.toggle}
          >
            <AppText variant="small" color={colors.primaryDark}>
              {hidden ? 'Zeigen' : 'Verbergen'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {/* Error is text + border, never color alone. */}
      {error ? (
        <AppText variant="small" color={colors.destructive} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontWeight: '600' },
  field: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: spacing.lg,
  },
  fieldError: { borderColor: colors.destructive, borderWidth: 2 },
  input: { flex: 1, minHeight: MIN_TOUCH, fontSize: 16, color: colors.foreground },
  toggle: { minHeight: MIN_TOUCH, paddingHorizontal: spacing.lg, justifyContent: 'center' },
});
