import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText, ErrorNotice } from '@/components/ui';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { useGoogleLogin } from './hooks';

/**
 * "Continue with Google": opens the Google account chooser. Works as login and signup — the backend
 * creates the account on first use, then the root route guard swaps to the signed-in stack.
 */
export function GoogleButton({ signUp }: { signUp?: boolean }) {
  const google = useGoogleLogin();
  const { t } = useI18n();
  const label = signUp ? t.entry.auth.googleSignUp : t.entry.auth.googleLogin;
  return (
    <View style={{ gap: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy: google.isPending }}
        disabled={google.isPending}
        onPress={() => google.mutate()}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
      >
        {google.isPending ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <Ionicons name="logo-google" size={20} color={colors.foreground} />
        )}
        <AppText variant="subheading">{label}</AppText>
      </Pressable>
      {google.error ? <ErrorNotice error={google.error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
});
