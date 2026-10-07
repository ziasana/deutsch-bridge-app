import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { useI18n } from '@/i18n';
import { detectDir } from '@/i18n/direction';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  /** Adds a show/hide toggle and masks input. */
  secret?: boolean;
  /** Rounded auth-screen look: brand-blue label and outline, eye icon for the password toggle. */
  pill?: boolean;
  /** With `pill`: dark label and grey outline (account/settings forms) instead of brand blue. */
  neutral?: boolean;
  /** Keeps the label for screen readers only (the screen shows a heading instead). */
  hideLabel?: boolean;
  /** Centres the typed text (single-question onboarding steps). */
  centered?: boolean;
  /** Outline + hint colour, e.g. the password-strength colour. */
  tint?: string;
  /** Helper text under the field, coloured with `tint`. */
  hint?: string;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, secret, pill, neutral, hideLabel, centered, tint, hint, ...input },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const { t, dir } = useI18n();
  // The text follows what is typed (German stays LTR, Persian RTL); an empty field - and so its
  // placeholder - follows the interface language.
  const typed = input.value ?? input.defaultValue ?? '';
  const textDir = typed ? detectDir(typed, dir) : dir;
  return (
    <View style={styles.wrap}>
      {hideLabel ? null : (
        <AppText
          variant={pill ? 'subheading' : 'small'}
          color={pill ? (neutral ? colors.ink : colors.primaryDark) : undefined}
          style={styles.label}
        >
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.field,
          pill && styles.fieldPill,
          pill && neutral && styles.fieldNeutral,
          !!tint && { borderColor: tint },
          !!error && styles.fieldError,
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secret && hidden}
          style={[
            styles.input,
            { writingDirection: textDir },
            input.multiline && styles.multiline,
            centered && styles.centered,
          ]}
          {...input}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t.common.showPassword : t.common.hidePassword}
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
                {hidden ? t.common.show : t.common.hide}
              </AppText>
            )}
          </Pressable>
        ) : null}
      </View>
      {hint && !error ? (
        <AppText variant="small" color={tint ?? colors.mutedForeground} style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
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
    paddingStart: spacing.lg,
  },
  fieldPill: {
    minHeight: 56,
    borderRadius: radius.pill,
    borderColor: colors.primaryDark,
    paddingStart: spacing.xl,
  },
  fieldNeutral: { borderColor: '#CFD3DA' },
  fieldError: { borderColor: colors.destructive, borderWidth: 2 },
  input: { flex: 1, minHeight: MIN_TOUCH, fontSize: 16, color: colors.foreground },
  centered: { textAlign: 'center' },
  hint: { paddingStart: spacing.lg },
  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
    paddingEnd: spacing.md,
    textAlignVertical: 'top',
  },
  toggle: { minHeight: MIN_TOUCH, paddingHorizontal: spacing.lg, justifyContent: 'center' },
});
