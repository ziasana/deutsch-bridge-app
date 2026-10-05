import { AppText, Button, Card, Screen } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';

// Temporary signed-in landing screen. Replaced by the tab navigator in Phase 3
// (logout then moves to Profile in Phase 12).
export default function SignedInHome() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <Screen>
      <AppText variant="title">Hallo {profile?.displayName} 👋</AppText>
      <Card>
        <AppText color={colors.mutedForeground}>{profile?.email}</AppText>
        <AppText>Niveau: {profile?.learningLevel ?? '–'}</AppText>
        <AppText>Erklärsprache: {profile?.preferredLanguage ?? 'EN'}</AppText>
      </Card>
      <Button label="Abmelden" variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}
