import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/errors';
import { AppText, Button, Card, ConfirmSheet, EmptyState, ErrorNotice, ErrorState, Header, Screen, Skeleton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ProfileOverview } from '@/types/examSimulation';
import { BLOCKED_REASON, formatPoints, simulationErrorMessage } from './format';
import { simKeys, useCancelSimulation, useSimulationHistory, useSimulationProfiles, useStartSimulation } from './hooks';
import { ContentSupply } from './overview/ContentSupply';
import { ExamJourney } from './overview/ExamJourney';
import { ResultsPanel } from './overview/ResultsPanel';
import { StartSheet } from './overview/StartSheet';

const COLOR = '#EC3E4E';

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.statLabel}>
        <Ionicons name={icon} size={14} color="rgba(255,255,255,0.85)" />
        <AppText variant="caption" color="rgba(255,255,255,0.85)" style={{ fontWeight: '600' }}>
          {label}
        </AppText>
      </View>
      <AppText style={styles.statValue}>{value}</AppText>
    </View>
  );
}

function ProfileSection({ profile }: { profile: ProfileOverview }) {
  const router = useRouter();
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = useStartSimulation();
  const cancel = useCancelSimulation();
  const running = !!profile.activeAttemptId;
  const lowContent = profile.parts.filter((p) => p.unused < p.required);

  const goRun = (attemptId: string, fresh: boolean) =>
    router.push({ pathname: '/exam-prep/pruefung/durchfuehrung', params: fresh ? { attempt: attemptId, fresh: '1' } : { attempt: attemptId } });

  const onStart = () =>
    start.mutate(profile.id, {
      onSuccess: (res) => {
        setConfirmStart(false);
        goRun(res.attemptId, true);
      },
      onError: (e) => {
        setConfirmStart(false);
        if (e instanceof ApiError && e.code === 'ACTIVE_ATTEMPT_EXISTS' && typeof e.details?.attemptId === 'string') {
          goRun(e.details.attemptId, false);
          return;
        }
        setError(simulationErrorMessage(e, 'Die Prüfung konnte nicht gestartet werden.'));
      },
    });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.hero}>
        <AppText variant="caption" color="rgba(255,255,255,0.85)" style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {profile.provider} · {profile.level}
        </AppText>
        <AppText style={styles.heroTitle} accessibilityRole="header">
          {profile.title}
        </AppText>
        <AppText color="rgba(255,255,255,0.92)">{profile.description ?? 'Eine vollständige Prüfung unter realistischen Bedingungen – mit Zeitlimit, ohne Lösungen vor der Abgabe.'}</AppText>
        <View style={styles.stats}>
          <Stat icon="timer-outline" label="Dauer" value={`${profile.totalMinutes} Min.`} />
          <Stat icon="locate-outline" label="Schriftlich" value={`${formatPoints(profile.writtenMaxPoints)} P.`} />
          <Stat icon="flag-outline" label="Bestehen ab" value={`${formatPoints(profile.writtenPassThreshold)} P.`} />
          <Stat icon="trophy-outline" label="Versuche" value={String(profile.attemptCount)} />
        </View>
        {running ? (
          <View style={{ gap: spacing.sm }}>
            {profile.activeAttemptPaused ? (
              <View style={styles.paused}>
                <Ionicons name="pause" size={14} color="#5B3A00" />
                <AppText variant="caption" color="#5B3A00" style={{ fontWeight: '800' }}>
                  Pausiert – die Zeit steht
                </AppText>
              </View>
            ) : null}
            <Button pill variant="secondary" color={COLOR} label={profile.activeAttemptPaused ? 'Pause beenden und fortsetzen' : 'Prüfung fortsetzen'} onPress={() => goRun(profile.activeAttemptId as string, false)} />
            <Button pill variant="ghost" color="#FFFFFF" label="Abbrechen" onPress={() => setConfirmCancel(true)} />
          </View>
        ) : (
          <Button pill variant="secondary" color={COLOR} label="Prüfung starten" disabled={!profile.canStart} loading={start.isPending} onPress={() => setConfirmStart(true)} />
        )}
      </View>

      {error ? <ErrorNotice message={error} /> : null}
      {profile.blockedReason && profile.blockedReason !== 'ACTIVE_ATTEMPT' ? (
        <View style={styles.blocked} accessibilityRole="alert">
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <AppText variant="small" style={{ flex: 1 }} color="#7A5000">
            {BLOCKED_REASON[profile.blockedReason]}
            {profile.blockedReason === 'INSUFFICIENT_CONTENT' && lowContent.length > 0 ? ` Betroffen: ${lowContent.map((p) => p.label).join(', ')}.` : ''}
          </AppText>
        </View>
      ) : null}

      <ExamJourney profile={profile} />

      <View style={{ gap: spacing.sm }}>
        {[
          { icon: 'clipboard-outline' as const, tone: '#0E9AA7', title: 'Schriftlich', text: `${formatPoints(profile.writtenMaxPoints)} Punkte, bestanden ab ${formatPoints(profile.writtenPassThreshold)}. Der Schriftliche Ausdruck wird von Hand bewertet – bis dahin steht das Ergebnis aus.` },
          { icon: 'mic-outline' as const, tone: '#E0457B', title: 'Mündlich', text: profile.oralScoringEnabled ? `${formatPoints(profile.oralMaxPoints)} Punkte, bestanden ab ${formatPoints(profile.oralPassThreshold)}.` : 'In dieser Simulation übst du nur – es gibt keine Punkte und kein Bestehen.' },
          { icon: 'trophy-outline' as const, tone: '#D98E04', title: 'Gesamtergebnis', text: '„Bestanden“ erscheint erst, wenn alle verlangten Teile bewertet sind. Jede Aufgabe wird dir nur einmal vorgelegt.' },
        ].map(({ icon, tone, title, text }) => (
          <Card key={title} style={styles.info}>
            <View style={[styles.infoIcon, { backgroundColor: `${tone}22` }]}>
              <Ionicons name={icon} size={22} color={tone} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="subheading">{title}</AppText>
              <AppText variant="small" color={colors.mutedForeground}>
                {text}
              </AppText>
            </View>
          </Card>
        ))}
      </View>

      <ContentSupply profile={profile} />

      <StartSheet visible={confirmStart} totalMinutes={profile.totalMinutes} starting={start.isPending} color={COLOR} onStart={onStart} onClose={() => setConfirmStart(false)} />
      <ConfirmSheet
        visible={confirmCancel}
        destructive
        title="Prüfung abbrechen?"
        message="Die Prüfung wird beendet und nicht gewertet. Die bereits zugeteilten Aufgaben werden dir nicht noch einmal angeboten."
        confirmLabel="Prüfung abbrechen"
        cancelLabel="Zurück"
        onConfirm={() => cancel.mutate(profile.activeAttemptId as string, { onSettled: () => setConfirmCancel(false) })}
        onCancel={() => setConfirmCancel(false)}
      />
    </View>
  );
}

/** The Probeprüfung hub: the exam at a glance, start / continue, and the learner's history. */
export function OverviewScreen() {
  const queryClient = useQueryClient();
  const profiles = useSimulationProfiles();
  const history = useSimulationHistory();
  const refreshing = (profiles.isRefetching || history.isRefetching) && !profiles.isPending;

  let body;
  if (profiles.isPending || history.isPending) {
    body = (
      <View accessibilityLabel="Probeprüfung wird geladen" style={{ gap: spacing.md }}>
        <Skeleton height={260} />
        <Skeleton height={200} />
      </View>
    );
  } else if (profiles.isError) {
    body = <ErrorState error={profiles.error} onRetry={() => void profiles.refetch()} />;
  } else if ((profiles.data ?? []).length === 0) {
    body = <EmptyState emoji="📝" title="Keine Probeprüfung" message="Derzeit ist keine Probeprüfung verfügbar." />;
  } else {
    const list = profiles.data ?? [];
    body = (
      <View style={{ gap: spacing.xl }}>
        {list.map((p) => (
          <ProfileSection key={p.id} profile={p} />
        ))}
        <ResultsPanel profile={list[0]} attempts={history.data?.attempts ?? []} progress={history.data?.progress ?? []} />
      </View>
    );
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void queryClient.invalidateQueries({ queryKey: simKeys.all })} />}
    >
      <Header back title="Probeprüfung" subtitle="Die ganze Prüfung unter realen Bedingungen" />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: COLOR },
  heroTitle: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontWeight: '800' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { flexBasis: '47%', flexGrow: 1, gap: 2, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.18)' },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { color: '#FFFFFF', fontSize: 20, lineHeight: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  paused: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: '#FBBF24' },
  blocked: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningSoft },
  info: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
