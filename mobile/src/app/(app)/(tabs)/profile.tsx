import { Alert, View } from 'react-native';
import { AppText, Button, Card, Header, Screen } from '@/components/ui';
import { DestinationList } from '@/features/navigation/DestinationList';
import { PROFILE_DESTINATIONS } from '@/features/navigation/destinations';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';

const LANGUAGE_LABEL = { EN: 'English', DE: 'Deutsch', PR: 'Persian' } as const;

export default function ProfileTab() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const confirmLogout = () =>
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <Screen bottomInset={false}>
      <Header title="Profile" />
      <Card>
        <AppText variant="heading">{profile?.displayName}</AppText>
        <AppText color={colors.mutedForeground}>{profile?.email}</AppText>
        <View style={{ height: 4 }} />
        <AppText>Niveau: {profile?.learningLevel ?? '–'}</AppText>
        <AppText>
          Erklärsprache: {profile?.preferredLanguage ? LANGUAGE_LABEL[profile.preferredLanguage] : 'English'}
        </AppText>
      </Card>
      <DestinationList items={PROFILE_DESTINATIONS} />
      <Button label="Abmelden" variant="secondary" onPress={confirmLogout} />
    </Screen>
  );
}
