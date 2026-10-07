import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, TextField, ErrorNotice } from '@/components/ui';
import { AuthFrame } from '@/features/auth/AuthForm';
import { useForgotPassword } from '@/features/auth/hooks';
import { createAuthSchemas, type ForgotPasswordForm } from '@/features/auth/schemas';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const forgot = useForgotPassword();
  const { t } = useI18n();
  const a = t.entry.auth;
  const schemas = useMemo(() => createAuthSchemas(a.errors), [a.errors]);
  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schemas.forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const submit = handleSubmit(({ email }) => forgot.mutate(email.trim()));

  return (
    <AuthFrame title={a.forgotTitle} subtitle={a.forgotSubtitle}>
      {forgot.isSuccess ? (
        <Card tone="accent">
          <AppText variant="subheading">{a.sentTitle}</AppText>
          <AppText color={colors.mutedForeground}>{a.sentBody}</AppText>
        </Card>
      ) : (
        <>
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
                returnKeyType="go"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={submit}
                error={fieldState.error?.message}
              />
            )}
          />
          {forgot.error ? <ErrorNotice error={forgot.error} /> : null}
          <Button pill label={a.sendLink} loading={forgot.isPending} onPress={submit} />
        </>
      )}
      <View style={styles.links}>
        <Link href="/login" accessibilityRole="link">
          <AppText variant="small" color={colors.primaryDark}>
            {a.backToLogin}
          </AppText>
        </Link>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({ links: { alignItems: 'center', paddingTop: spacing.sm } });
