import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, TextField, ErrorNotice } from '@/components/ui';
import { AuthFrame } from '@/features/auth/AuthForm';
import { GoogleButton } from '@/features/auth/GoogleButton';
import { useLogin } from '@/features/auth/hooks';
import { createAuthSchemas, type LoginForm } from '@/features/auth/schemas';
import { authErrorMessage } from '@/features/auth/serverError';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const login = useLogin();
  const { t } = useI18n();
  const a = t.entry.auth;
  const schemas = useMemo(() => createAuthSchemas(a.errors), [a.errors]);
  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schemas.loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <AuthFrame>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            pill
            label={a.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            pill
            label={a.password}
            secret
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={handleSubmit((v) => login.mutate(v))}
            error={fieldState.error?.message}
          />
        )}
      />
      {login.error ? (
        <ErrorNotice
          error={login.error}
          message={authErrorMessage(login.error, a.serverErrors, false)}
        />
      ) : null}
      <Button
        pill
        label={a.login}
        loading={login.isPending || formState.isSubmitting}
        onPress={handleSubmit((v) => login.mutate(v))}
      />
      <GoogleButton />
      <View style={styles.links}>
        <Link href="/forgot-password" accessibilityRole="link">
          <AppText variant="small" color={colors.primaryDark}>
            {a.forgot}
          </AppText>
        </Link>
        <AppText variant="small" color={colors.mutedForeground}>
          {a.noAccount}{' '}
          <Link href="/register" accessibilityRole="link" style={styles.link}>
            {a.signUp}
          </Link>
        </AppText>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.primaryDark, fontWeight: '600' },
  links: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm },
});
