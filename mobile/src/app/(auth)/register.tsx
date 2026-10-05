import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, TextField } from '@/components/ui';
import { AuthFrame } from '@/features/auth/AuthForm';
import { useRegister } from '@/features/auth/hooks';
import { registerSchema, type RegisterForm } from '@/features/auth/schemas';
import { colors, spacing } from '@/theme';

export default function RegisterScreen() {
  const register = useRegister();
  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', passwordConfirmation: '' },
  });
  const submit = handleSubmit(({ displayName, email, password }) =>
    register.mutate({ displayName: displayName.trim(), email: email.trim(), password }),
  );

  return (
    <AuthFrame title="Konto erstellen" subtitle="Starte deine Deutsch-Lernroutine in wenigen Sekunden.">
      <Controller
        control={control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextField
            label="Name"
            autoComplete="name"
            textContentType="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
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
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="passwordConfirmation"
        render={({ field, fieldState }) => (
          <TextField
            label="Passwort bestätigen"
            secret
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="go"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={submit}
            error={fieldState.error?.message}
          />
        )}
      />
      {register.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {register.error.message}
        </AppText>
      ) : null}
      <Button label="Registrieren" loading={register.isPending} onPress={submit} />
      <View style={styles.links}>
        <Link href="/login" accessibilityRole="link">
          <AppText variant="small" color={colors.primaryDark}>
            Schon ein Konto? Anmelden
          </AppText>
        </Link>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({ links: { alignItems: 'center', paddingTop: spacing.sm } });
