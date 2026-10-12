import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { AttemptSummary, ProfileOverview, ProgressPoint } from '@/types/examSimulation';
import { formatDateTime, formatDuration, formatPoints } from '../format';
import { ResultBadge } from '../ResultBadge';
import { ScoreRing } from '../ScoreRing';

const ringColor = (a: AttemptSummary, threshold: number) =>
  !a.writtenComplete ? colors.warning : (a.writtenScore ?? 0) >= threshold ? colors.success : colors.destructive;

function Highlight({ title, icon, a, profile, onPress }: { title: string; icon: keyof typeof Ionicons.glyphMap; a: AttemptSummary; profile: ProfileOverview; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ansehen`} onPress={onPress} style={styles.highlight}>
      <ScoreRing
        score={a.writtenComplete ? a.writtenScore : null}
        max={a.writtenMax}
        threshold={profile.writtenPassThreshold}
        size={76}
        stroke={8}
        arc={ringColor(a, profile.writtenPassThreshold)}
        label={`${formatPoints(a.writtenScore)} von ${formatPoints(a.writtenMax)} Punkten`}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={14} color={colors.mutedForeground} />
          <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '800', textTransform: 'uppercase' }}>
            {title}
          </AppText>
        </View>
        <ResultBadge status={a.writtenResult} />
        <AppText variant="caption" color={colors.mutedForeground}>
          {formatDateTime(a.endedAtMs ?? a.startedAtMs)}
        </AppText>
      </View>
    </Pressable>
  );
}

function AttemptRow({ a, profile, onOpen }: { a: AttemptSummary; profile: ProfileOverview; onOpen: (a: AttemptSummary) => void }) {
  const cancelled = a.status === 'CANCELLED';
  const running = a.status === 'IN_PROGRESS';
  const pct = a.writtenMax ? Math.min(100, ((a.writtenScore ?? 0) / a.writtenMax) * 100) : 0;
  const passPct = a.writtenMax ? (profile.writtenPassThreshold / a.writtenMax) * 100 : 0;
  const state = running ? 'Läuft' : cancelled ? 'Abgebrochen' : a.status === 'EXPIRED' ? 'Zeit abgelaufen' : 'Abgegeben';
  const tone = running ? colors.warning : cancelled ? colors.mutedForeground : colors.success;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatDateTime(a.startedAtMs)}, ${state}`}
      disabled={cancelled}
      onPress={() => onOpen(a)}
      style={[styles.row, cancelled && { opacity: 0.6 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${tone}22` }]}>
        <Ionicons name={running ? 'pause' : cancelled ? 'close-circle-outline' : 'checkmark-circle'} size={20} color={tone} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="small" style={{ fontWeight: '700' }}>
          {formatDateTime(a.startedAtMs)}
        </AppText>
        <AppText variant="caption" color={colors.mutedForeground}>
          {state} · {formatDuration(a.durationSeconds)}
        </AppText>
        {!cancelled && !running ? (
          <View style={styles.meter}>
            <View style={{ height: 6, width: `${pct}%`, backgroundColor: a.writtenComplete ? (pct >= passPct ? colors.success : colors.destructive) : colors.warning }} />
            <View style={[styles.pass, { left: `${passPct}%` }]} />
          </View>
        ) : null}
      </View>
      {!cancelled && !running ? (
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <AppText variant="small" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {a.writtenComplete ? '' : '≥ '}
            {formatPoints(a.writtenScore)}
            <AppText variant="caption" color={colors.mutedForeground}> / {formatPoints(a.writtenMax)}</AppText>
          </AppText>
        </View>
      ) : null}
      {!cancelled ? <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} /> : null}
    </Pressable>
  );
}

/** Written score of every finished attempt as bars; the line is where "bestanden" starts. */
function ProgressChart({ points, max, threshold }: { points: ProgressPoint[]; max: number; threshold: number }) {
  const shown = points.filter((p) => p.writtenScore != null).slice(-12);
  if (shown.length === 0) return <AppText variant="small" color={colors.mutedForeground}>Noch keine abgeschlossene Prüfung.</AppText>;
  const height = 120;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Punkte der letzten ${shown.length} Prüfungen, bestanden ab ${formatPoints(threshold)}`}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
        {shown.map((p) => {
          const h = Math.max(4, ((p.writtenScore ?? 0) / max) * height);
          const ok = (p.writtenScore ?? 0) >= threshold;
          return (
            <View key={p.attemptId} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
              <AppText variant="caption" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {formatPoints(p.writtenScore)}
              </AppText>
              <View style={{ width: '100%', height: h, borderRadius: 6, backgroundColor: !p.writtenComplete ? colors.warning : ok ? colors.success : colors.destructive }} />
            </View>
          );
        })}
        <View pointerEvents="none" style={[styles.threshold, { bottom: (threshold / max) * height }]} />
      </View>
    </View>
  );
}

type Props = { profile: ProfileOverview | undefined; attempts: AttemptSummary[]; progress: ProgressPoint[] };

export function ResultsPanel({ profile, attempts, progress }: Props) {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'chart'>('list');
  const [showCancelled, setShowCancelled] = useState(false);
  const visible = attempts.filter((a) => showCancelled || a.status !== 'CANCELLED');
  const hasCancelled = attempts.some((a) => a.status === 'CANCELLED');
  const open = (a: AttemptSummary) =>
    router.push({
      pathname: a.status === 'IN_PROGRESS' ? '/exam-prep/pruefung/durchfuehrung' : '/exam-prep/pruefung/ergebnis',
      params: { attempt: a.id },
    });

  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="heading" accessibilityRole="header">
        Dein Verlauf
      </AppText>
      {profile && (profile.latest || profile.best) ? (
        <View style={{ gap: spacing.sm }}>
          {profile.latest ? <Highlight title="Letztes Ergebnis" icon="time-outline" a={profile.latest} profile={profile} onPress={() => open(profile.latest as AttemptSummary)} /> : null}
          {profile.best ? <Highlight title="Bestes Ergebnis" icon="trophy-outline" a={profile.best} profile={profile} onPress={() => open(profile.best as AttemptSummary)} /> : null}
        </View>
      ) : null}
      <View style={styles.switch} accessibilityRole="tablist">
        {(['list', 'chart'] as const).map((key) => (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: view === key }} onPress={() => setView(key)} style={[styles.tab, view === key && styles.tabOn]}>
            <AppText variant="small" style={{ fontWeight: '700' }} color={view === key ? colors.ink : colors.mutedForeground}>
              {key === 'list' ? 'Versuche' : 'Entwicklung'}
            </AppText>
          </Pressable>
        ))}
      </View>
      {view === 'chart' ? (
        <ProgressChart points={progress} max={profile?.writtenMaxPoints ?? 225} threshold={profile?.writtenPassThreshold ?? 135} />
      ) : attempts.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="small" center color={colors.mutedForeground}>
            Du hast noch keine Prüfung gemacht. Dein erster Versuch erscheint hier.
          </AppText>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {profile ? visible.map((a) => <AttemptRow key={a.id} a={a} profile={profile} onOpen={open} />) : null}
          {hasCancelled ? (
            <Pressable accessibilityRole="button" onPress={() => setShowCancelled((v) => !v)} style={{ minHeight: 44, justifyContent: 'center' }}>
              <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '600' }}>
                {showCancelled ? 'Abgebrochene Versuche ausblenden' : 'Abgebrochene Versuche anzeigen'}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  meter: { height: 6, borderRadius: 3, backgroundColor: colors.secondary, overflow: 'hidden' },
  pass: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.ink },
  switch: { flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: colors.secondary },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  tabOn: { backgroundColor: colors.surface },
  empty: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.accent },
  threshold: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.ink, opacity: 0.6 },
});
