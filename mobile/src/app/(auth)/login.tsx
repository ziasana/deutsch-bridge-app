import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, TextField } from '@/components/ui';
import { AuthFrame } from '@/features/auth/AuthForm';
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
    <AuthFrame
      title="Willkommen zurück 👋"
      subtitle="Melde dich an und lerne dort weiter, wo du aufgehört hast."
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
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
        label="Anmelden"
        loading={login.isPending || formState.isSubmitting}
        onPress={handleSubmit((v) => login.mutate(v))}
      />
      <View style={styles.links}>
        <Link href="/forgot-password" accessibilityRole="link">
          <AppText variant="small" color={colors.primaryDark}>
            Passwort vergessen?
          </AppText>
        </Link>
        <Link href="/register" accessibilityRole="link">
          <AppText variant="small" color={colors.primaryDark}>
            Noch kein Konto? Registrieren
          </AppText>
        </Link>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  links: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm },
});
