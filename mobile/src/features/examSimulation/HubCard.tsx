import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { tint } from '@/features/exam/components/kit';
import { colors, radius, spacing } from '@/theme';
import { formatPoints } from './format';
import { useSimulationProfiles } from './hooks';

const COLOR = '#EC3E4E';

/** Entry to the Probeprüfung at the top of the exam hub: the whole exam under real conditions. */
export function SimulationHubCard() {
  const router = useRouter();
  const profile = useSimulationProfiles().data?.[0];
  const open = () => router.push('/exam-prep/pruefung');
  const running = !!profile?.activeAttemptId;
  const status = profile?.activeAttemptPaused
    ? 'Pausiert – die Zeit steht'
    : running
      ? 'Eine Prüfung läuft'
      : profile?.latest
        ? `Letztes Ergebnis: ${formatPoints(profile.latest.writtenScore)} / ${formatPoints(profile.latest.writtenMax)} Punkte`
        : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Probeprüfung"
      accessibilityHint="Die ganze Prüfung unter realen Bedingungen"
      onPress={open}
      style={[styles.card, { backgroundColor: tint(COLOR, '14'), borderColor: tint(COLOR, '33') }]}
    >
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: tint(COLOR, '33') }]}>
          <Ionicons name="timer-outline" size={30} color={COLOR} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={styles.title}>Probeprüfung</AppText>
          <AppText variant="small" color={colors.ink}>
            Die ganze Prüfung unter realen Bedingungen – mit Zeitlimit und Auswertung.
          </AppText>
        </View>
      </View>
      {status ? (
        <AppText variant="small" color={colors.mutedForeground} style={{ fontWeight: '600' }}>
          {status}
        </AppText>
      ) : null}
      <Button pill color={COLOR} label={running ? 'Fortsetzen' : 'Zur Probeprüfung'} onPress={open} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1.5 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.ink },
});
