import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { enablePush, getPushState } from './push';

const pushKey = ['notifications', 'push-state'] as const;

/** Per-device switch for push: asks the OS permission on request, never on its own. */
export function PushCard() {
  const queryClient = useQueryClient();
  const state = useQuery({ queryKey: pushKey, queryFn: getPushState });
  const enable = useMutation({
    mutationFn: enablePush,
    onSuccess: (next) => queryClient.setQueryData(pushKey, next),
  });

  if (!state.data || state.data === 'unsupported') return null;

  return (
    <Card style={{ gap: spacing.sm }}>
      <AppText variant="caption" color={colors.primaryDark}>
        PUSH-BENACHRICHTIGUNGEN
      </AppText>
      {state.data === 'granted' ? (
        <AppText>Aktiv auf diesem Gerät. Erinnerungen erreichen dich auch, wenn die App geschlossen ist.</AppText>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <AppText color={colors.mutedForeground}>
            {state.data === 'denied'
              ? 'Benachrichtigungen sind für Deutsch Bridge in den Geräte-Einstellungen ausgeschaltet.'
              : 'Erhalte Erinnerungen auch, wenn die App geschlossen ist.'}
          </AppText>
          {state.data === 'denied' ? (
            <Button label="Einstellungen öffnen" variant="secondary" onPress={() => void Linking.openSettings()} />
          ) : (
            <Button label="Push aktivieren" loading={enable.isPending} onPress={() => enable.mutate()} />
          )}
        </View>
      )}
    </Card>
  );
}
