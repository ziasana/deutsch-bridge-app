import {
  AppText,
  Badge,
  Card,
  Chip,
  EmptyState,
  LearningCelebration,
  ListItem,
  PrimaryCTA,
  ProgressBar,
  Screen,
  SectionHeader,
  SecondaryButton,
} from '@/components/ui';
import { env } from '@/config/env';
import { colors } from '@/theme';

// Phase 1 landing screen: proves the app boots and previews the design system.
// Replaced by the auth gate + tabs in Phases 2–3.
export default function Foundation() {
  return (
    <Screen>
      <AppText variant="title">Deutsch Bridge</AppText>
      <AppText color={colors.mutedForeground}>Foundation · {env.apiBaseUrl}</AppText>

      <Card>
        <Badge label="Weiterlernen" tone="primary" />
        <AppText variant="heading">📖 Lesen – Teil 2</AppText>
        <AppText color={colors.mutedForeground}>Digitale Kommunikation im Alltag</AppText>
        <ProgressBar value={70} label="70 Prozent abgeschlossen" />
        <PrimaryCTA label="Weiterlernen" onPress={() => {}} />
        <SecondaryButton label="Später" onPress={() => {}} />
      </Card>

      <SectionHeader title="Komponenten" actionLabel="Alle" onAction={() => {}} />
      <Card>
        <ListItem title="Daily Words" subtitle="5 / 5" trailing={<Badge label="Fertig" tone="success" />} />
        <ListItem title="Grammatik" subtitle="10 Minuten" trailing={<Badge label="Offen" />} />
      </Card>
      <Card>
        <AppText variant="small" color={colors.mutedForeground}>
          Chips
        </AppText>
        <Chip label="A1" />
        <Chip label="B1" selected />
      </Card>
      <EmptyState
        title="Keine Wörter zur Wiederholung"
        message="Du hast momentan keine Wörter zur Wiederholung."
        actionLabel="Neue Wörter lernen"
        onAction={() => {}}
      />
      <LearningCelebration
        title="Sehr gut!"
        subtitle="Daily Words abgeschlossen"
        progress={{ value: 5, max: 5 }}
        progressLabel="5 / 5 Wörter gelernt"
        primaryAction={{ label: 'Noch einmal üben', onPress: () => {} }}
        secondaryAction={{ label: 'Zum Dashboard', onPress: () => {} }}
      />
    </Screen>
  );
}
