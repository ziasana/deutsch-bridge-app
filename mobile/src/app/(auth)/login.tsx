import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, TextField } from '@/components/ui';
import { AuthFrame } from '@/features/auth/AuthForm';
import { GoogleButton } from '@/features/auth/GoogleButton';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema, type LoginForm } from '@/features/auth/schemas';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const login = useLogin();
  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
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
            label="E-Mail"
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
            label="Passwort"
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
        <AppText color={colors.destructive} accessibilityRole="alert">
          {login.error.message}
        </AppText>
      ) : null}
      <Button
        pill
        label="Anmelden"
        loading={login.isPending || formState.isSubmitting}
        onPress={handleSubmit((v) => login.mutate(v))}
      />
      <GoogleButton />
      <View style={styles.links}>
        <Link href="/forgot-password" accessibilityRole="link">
          <AppText variant="small" color={colors.primaryDark}>
            Passwort vergessen?
          </AppText>
        </Link>
        <AppText variant="small" color={colors.mutedForeground}>
          Noch kein Konto?{' '}
          <Link href="/register" accessibilityRole="link" style={styles.link}>
            Registrieren
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
