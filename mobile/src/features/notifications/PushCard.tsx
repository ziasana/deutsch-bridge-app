import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';
import { enablePush, getPushState } from './push';

const pushKey = ['notifications', 'push-state'] as const;

/** Per-device switch for push: asks the OS permission on request, never on its own. */
export function PushCard() {
  const { t } = useI18n();
  const p = t.notifications.push;
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
        {p.title}
      </AppText>
      {state.data === 'granted' ? (
        <AppText>{p.active}</AppText>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <AppText color={colors.mutedForeground}>
            {state.data === 'denied' ? p.denied : p.offer}
          </AppText>
          {state.data === 'denied' ? (
            <Button label={p.openSettings} variant="secondary" onPress={() => void Linking.openSettings()} />
          ) : (
            <Button label={p.enable} loading={enable.isPending} onPress={() => enable.mutate()} />
          )}
        </View>
      )}
    </Card>
  );
}
