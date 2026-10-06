import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';
import { MIN_TOUCH, colors, spacing } from '@/theme';

/**
 * "Login with Google" entry. The backend has no Google token endpoint for the mobile app yet, so
 * for now this only explains that — wire `onPress` to the OAuth flow once the endpoint exists.
 */
export function GoogleButton({ label = 'Mit Google anmelden' }: { label?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() =>
        Alert.alert('Bald verfügbar', 'Die Anmeldung mit Google ist noch nicht freigeschaltet.')
      }
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
    >
      <AppText variant="subheading">{label}</AppText>
      <Ionicons name="logo-google" size={20} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
