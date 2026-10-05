import { AppText, Card, Screen } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';

// Placeholder until the dashboard lands in Phase 4.
export default function HomeTab() {
  const name = useAuthStore((s) => s.profile?.displayName);
  return (
    <Screen bottomInset={false}>
      <AppText variant="title">Hallo{name ? `, ${name}` : ''} 👋</AppText>
      <Card tone="accent">
        <AppText variant="subheading">Bereit für deine nächste Deutsch-Lerneinheit?</AppText>
        <AppText color={colors.mutedForeground}>Dein persönliches Dashboard folgt als Nächstes.</AppText>
      </Card>
    </Screen>
  );
}
