import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, ProgressRing } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { tint } from '../../components/kit';
import { LEARN_SECTIONS, type LearnSectionId } from '../writingMeta';
import type { Station, StationResult } from './types';
import { WRITING_COLOR } from './ui';

const meta = (id: LearnSectionId) => LEARN_SECTIONS.find((s) => s.id === id)!;
/** Rough reading/practice time so the learner knows what they sign up for. */
const minutes = (steps: number) => Math.max(1, Math.round(steps * 0.6));
const NODE = 44;

/** The learning path: stations in the recommended order, progress, and a clear "next". */
export function LearnPath({
  stations,
  done,
  onOpen,
  onReset,
  onPractice,
}: {
  stations: Station[];
  done: Partial<Record<LearnSectionId, StationResult>>;
  onOpen: (id: LearnSectionId) => void;
  onReset: () => void;
  onPractice: () => void;
}) {
  const doneCount = stations.filter((s) => done[s.id]).length;
  const next = stations.find((s) => !done[s.id]);
  const allDone = doneCount === stations.length;
  const pct = Math.round((doneCount / stations.length) * 100);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={[styles.hero, { backgroundColor: tint(WRITING_COLOR, '14') }]}>
        <ProgressRing value={pct} size={84} stroke={9} color={WRITING_COLOR} textSize={19} label={`${doneCount} von ${stations.length} Stationen geschafft`} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={styles.heroTitle}>
            {allDone ? 'Alles geschafft! 🎉' : doneCount === 0 ? 'Los geht’s!' : 'Weiter so!'}
          </AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {allDone
              ? 'Du kennst jetzt die Methode. Wende sie in den Schreibaufgaben an.'
              : `${doneCount} von ${stations.length} Stationen · noch ${stations.length - doneCount} bis zum Schreib-Profi.`}
          </AppText>
        </View>
      </View>

      {allDone ? (
        <Button pill label="Zu den Schreibaufgaben" onPress={onPractice} />
      ) : next ? (
        <Button
          pill
          label={`${doneCount === 0 ? 'Starten' : 'Weiterlernen'}: ${meta(next.id).label}`}
          onPress={() => onOpen(next.id)}
        />
      ) : null}

      <View>
        {stations.map((s, i) => {
          const m = meta(s.id);
          const result = done[s.id];
          const isNext = next?.id === s.id;
          const last = i === stations.length - 1;
          return (
            <View key={s.id} style={styles.row}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.node,
                    result
                      ? { backgroundColor: colors.success, borderColor: colors.success }
                      : { borderColor: isNext ? WRITING_COLOR : colors.border, backgroundColor: isNext ? tint(WRITING_COLOR, '1F') : colors.surface },
                  ]}
                >
                  {result ? <Ionicons name="checkmark" size={24} color="#FFFFFF" /> : <AppText style={{ fontSize: 20, lineHeight: 26 }}>{m.emoji}</AppText>}
                </View>
                {!last ? <View style={[styles.line, { backgroundColor: result ? colors.success : colors.border }]} /> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${i + 1}. ${m.label}${result ? ', geschafft' : ''}`}
                onPress={() => onOpen(s.id)}
                style={({ pressed }) => [
                  styles.card,
                  isNext && { borderColor: WRITING_COLOR, backgroundColor: tint(WRITING_COLOR, '14') },
                  result && !isNext && { borderColor: tint(colors.success, '33') },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  {isNext ? (
                    <AppText variant="caption" color={WRITING_COLOR} style={{ fontWeight: '800', letterSpacing: 0.6 }}>
                      ALS NÄCHSTES
                    </AppText>
                  ) : null}
                  <AppText variant="subheading">
                    {i + 1}. {m.label}
                  </AppText>
                  <AppText variant="small" color={colors.mutedForeground}>{m.hint}</AppText>
                  <AppText variant="caption" color={colors.mutedForeground}>
                    {s.steps.length} Schritte · ca. {minutes(s.steps.length)} Min.
                    {result && result.total > 0 ? ` · ${result.correct}/${result.total} richtig` : ''}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
          );
        })}
      </View>

      {doneCount > 0 ? (
        <Button label="↺ Fortschritt zurücksetzen" variant="ghost" onPress={onReset} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, borderRadius: radius.lg },
  heroTitle: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  rail: { width: NODE, alignItems: 'center' },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 4, borderRadius: 2, marginVertical: 2 },
  card: {
    flex: 1,
    minHeight: MIN_TOUCH + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
