import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatClock } from '../format';

type Props = { color: string; stageLabel: string; remainingSeconds: number; busy: boolean; onContinue: () => void; onFinish: () => void; onLeave: () => void };

/** Shown instead of the tasks while the exam is paused: the clock is stopped and nothing of the exam is visible. */
export function PauseScreen({ color, stageLabel, remainingSeconds, busy, onContinue, onFinish, onLeave }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <View style={[styles.hero, { backgroundColor: color }]}>
          <View style={styles.icon}>
            <Ionicons name="pause" size={32} color="#FFFFFF" />
          </View>
          <AppText style={styles.title} accessibilityRole="header">
            Prüfung pausiert
          </AppText>
          <AppText color="rgba(255,255,255,0.92)" center>
            Die Zeit steht. Deine Antworten sind gespeichert.
          </AppText>
        </View>
        <View style={styles.body}>
          <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '700', textTransform: 'uppercase' }}>
            {stageLabel}
          </AppText>
          <AppText style={styles.clock} accessibilityRole="timer" accessibilityLabel={`Verbleibende Zeit ${formatClock(remainingSeconds)}`}>
            {formatClock(remainingSeconds)}
          </AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            verbleibende Zeit
          </AppText>
          <View style={styles.actions}>
            <Button pill color={color} label="Prüfung fortsetzen" loading={busy} onPress={onContinue} />
            <Button pill variant="secondary" label="Prüfung beenden" disabled={busy} onPress={onFinish} />
            <Button pill variant="ghost" label="Zur Übersicht" disabled={busy} onPress={onLeave} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  card: { overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  hero: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  icon: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontWeight: '800' },
  body: { alignItems: 'center', gap: spacing.xs, padding: spacing.xl },
  clock: { fontSize: 48, lineHeight: 56, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
