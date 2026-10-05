import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AppText, Card, EmptyState, ErrorState, Header, Screen, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import { SECTION_META } from './examMeta';
import { formatClock, formatDifference } from './time/examTime';
import { useTimeManagement } from './time/hooks';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <AppText variant="caption" color={colors.mutedForeground}>
        {label}
      </AppText>
      <AppText style={{ fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{value}</AppText>
    </View>
  );
}

/** Average finished time per Teil next to the recommended time. */
export function ZeitmanagementScreen() {
  const params = useLocalSearchParams<{ level?: string }>();
  const profileLevel = useAuthStore((s) => s.profile?.learningLevel);
  const level =
    params.level || (profileLevel && profileLevel !== 'null' ? profileLevel : 'B1');
  const query = useTimeManagement(level);

  let body;
  if (query.isPending) {
    body = (
      <View accessibilityLabel="Zeiten werden geladen" style={{ gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={96} />
        ))}
      </View>
    );
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (query.data.length === 0) {
    body = (
      <EmptyState
        emoji="⏱"
        title="Noch keine Zeiten"
        message={`Noch keine abgeschlossenen Übungen mit Zeitmessung für ${level}. Öffne eine Übung und schließe sie ab – deine Zeiten erscheinen dann hier.`}
      />
    );
  } else {
    body = (
      <View style={{ gap: spacing.md }}>
        {query.data.map((row) => {
          const within = row.differenceSeconds != null && row.differenceSeconds <= 0;
          return (
            <Card key={`${row.section}-${row.teil}`} style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="subheading">
                  {SECTION_META[row.section]?.label ?? row.section} · Teil {row.teil}
                </AppText>
                <AppText variant="small" color={colors.mutedForeground}>
                  {row.sessions} {row.sessions === 1 ? 'Übung' : 'Übungen'}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl }}>
                <Stat label="Durchschnitt" value={formatClock(row.averageSeconds)} />
                {row.targetSeconds != null && row.differenceSeconds != null ? (
                  <>
                    <Stat label="Empfohlen" value={formatClock(row.targetSeconds)} />
                    <Stat label="Unterschied" value={formatDifference(row.differenceSeconds)} />
                  </>
                ) : null}
              </View>
              {within ? <AppText color="#1B7A55">✓ Innerhalb der Vorgabe</AppText> : null}
            </Card>
          );
        })}
      </View>
    );
  }

  return (
    <Screen>
      <Header title="Mein Zeitmanagement" subtitle={`TELC ${level} – deine durchschnittliche Zeit pro Teil`} back />
      {body}
    </Screen>
  );
}
