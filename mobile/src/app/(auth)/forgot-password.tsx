import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, TextField } from '@/components/ui';
import { AuthFrame } from '@/features/auth/AuthForm';
import { useForgotPassword } from '@/features/auth/hooks';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/features/auth/schemas';
import { colors, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const forgot = useForgotPassword();
  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const submit = handleSubmit(({ email }) => forgot.mutate(email.trim()));

  return (
    <AuthFrame
      title="Passwort vergessen?"
      subtitle="Wir senden dir einen Link zum Zurücksetzen per E-Mail."
    >
      {forgot.isSuccess ? (
        <Card tone="accent">
          <AppText variant="subheading">E-Mail gesendet ✉️</AppText>
          <AppText color={colors.mutedForeground}>
            Bitte prüfe dein Postfach und folge dem Link, um ein neues Passwort zu vergeben.
          </AppText>
        </Card>
      ) : (
        <>
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
                returnKeyType="go"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={submit}
                error={fieldState.error?.message}
              />
            )}
          />
          {forgot.error ? (
            <AppText color={colors.destructive} accessibilityRole="alert">
              {forgot.error.message}
            </AppText>
          ) : null}
          <Button pill label="Link senden" loading={forgot.isPending} onPress={submit} />
        </>
      )}
      <View style={styles.links}>
        <Link href="/login" accessibilityRole="link">
          <AppText variant="small" color={colors.primaryDark}>
            Zurück zur Anmeldung
          </AppText>
        </Link>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({ links: { alignItems: 'center', paddingTop: spacing.sm } });
