import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  /** Adds a show/hide toggle and masks input. */
  secret?: boolean;
  /** Rounded auth-screen look: brand-blue label and outline, eye icon for the password toggle. */
  pill?: boolean;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, secret, pill, ...input },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      <AppText
        variant={pill ? 'subheading' : 'small'}
        color={pill ? colors.primaryDark : undefined}
        style={styles.label}
      >
        {label}
      </AppText>
      <View style={[styles.field, pill && styles.fieldPill, !!error && styles.fieldError]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secret && hidden}
          style={[styles.input, input.multiline && styles.multiline]}
          {...input}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Passwort anzeigen' : 'Passwort verbergen'}
            onPress={() => setHidden((h) => !h)}
            style={styles.toggle}
          >
            {pill ? (
              <Ionicons
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color={colors.mutedForeground}
              />
            ) : (
              <AppText variant="small" color={colors.primaryDark}>
                {hidden ? 'Zeigen' : 'Verbergen'}
              </AppText>
            )}
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
  fieldPill: {
    minHeight: 56,
    borderRadius: radius.pill,
    borderColor: colors.primaryDark,
    paddingLeft: spacing.xl,
  },
  fieldError: { borderColor: colors.destructive, borderWidth: 2 },
  input: { flex: 1, minHeight: MIN_TOUCH, fontSize: 16, color: colors.foreground },
  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
    paddingRight: spacing.md,
    textAlignVertical: 'top',
  },
  toggle: { minHeight: MIN_TOUCH, paddingHorizontal: spacing.lg, justifyContent: 'center' },
});
