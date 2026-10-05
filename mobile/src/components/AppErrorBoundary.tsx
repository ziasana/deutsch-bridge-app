import type { ErrorBoundaryProps } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** Last line of defence: an unexpected render error shows this instead of a blank/crashed app. */
export function AppErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.md,
        backgroundColor: colors.background,
      }}
    >
      <AppText variant="heading" center>
        Etwas ist schiefgelaufen
      </AppText>
      <AppText center color={colors.mutedForeground}>
        Das tut uns leid. Bitte versuche es noch einmal. Dein Lernfortschritt ist gespeichert.
      </AppText>
      <Button label="Erneut versuchen" onPress={() => void retry()} />
    </View>
  );
}
