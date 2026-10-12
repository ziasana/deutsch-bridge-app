import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { PartOverview, ProfileOverview } from '@/types/examSimulation';
import { SIM_SECTION, formatPoints } from '../format';

const partsOf = (profile: ProfileOverview, keys: string[]): PartOverview[] => profile.parts.filter((p) => keys.includes(p.key));

/**
 * The exam as a journey: a bar whose segments are as wide as the sections are long. Tap a section to see what is in it;
 * the points bar below lights up its parts, and its marker shows where "bestanden" starts.
 */
export function ExamJourney({ profile }: { profile: ProfileOverview }) {
  const [selected, setSelected] = useState(0);
  const stage = profile.stages[Math.min(selected, profile.stages.length - 1)];
  const total = profile.stages.reduce((n, s) => n + s.minutes, 0) || 1;
  const stageParts = stage ? partsOf(profile, stage.partKeys) : [];
  const written = profile.parts.filter((p) => p.module === 'WRITTEN' && p.maxPoints > 0);
  const writtenTotal = written.reduce((n, p) => n + p.maxPoints, 0) || 1;
  const pass = (profile.writtenPassThreshold / writtenTotal) * 100;
  const starts = profile.stages.map((_, i) => profile.stages.slice(0, i).reduce((n, st) => n + st.minutes, 0));

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <AppText variant="heading" accessibilityRole="header">
          So läuft die Prüfung ab
        </AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          Tippe auf einen Abschnitt – {profile.totalMinutes} Minuten insgesamt.
        </AppText>
      </View>

      <View style={styles.bar} accessibilityRole="tablist">
        {profile.stages.map((s, i) => {
          const sections = Array.from(new Set(partsOf(profile, s.partKeys).map((p) => p.section)));
          const prep = s.kind === 'PREPARATION';
          const color = prep ? '#F59E0B' : SIM_SECTION[sections[0] ?? 'LESEVERSTEHEN'].color;
          const active = i === selected;
          return (
            <Pressable
              key={s.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${s.label}, ${s.minutes} Minuten`}
              onPress={() => setSelected(i)}
              style={[styles.segment, { flexGrow: s.minutes, backgroundColor: color, opacity: active ? 1 : 0.55 }, active && styles.segmentActive]}
            >
              <Ionicons name={prep ? 'eye-outline' : SIM_SECTION[sections[0] ?? 'LESEVERSTEHEN'].icon} size={18} color="#FFFFFF" />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.scale}>
        <AppText variant="caption" color={colors.mutedForeground}>0</AppText>
        <AppText variant="caption" color={colors.mutedForeground}>{total} Min.</AppText>
      </View>

      {stage ? (
        <View style={styles.detail}>
          <View style={styles.detailHead}>
            <AppText style={{ flex: 1, fontWeight: '800' }}>
              {selected + 1}. {stage.label}
            </AppText>
            <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '700' }}>
              Minute {starts[selected]}–{starts[selected] + stage.minutes} · {stage.minutes} Min.
            </AppText>
          </View>
          {stage.kind === 'PREPARATION' ? (
            <AppText variant="small" color={colors.mutedForeground}>
              Vorbereitungszeit: Du siehst die Aufgaben schon jetzt, gesprochen wird danach. Antworten werden erst in der Übungszeit gespeichert.
            </AppText>
          ) : (
            stageParts.map((p) => {
              const st = SIM_SECTION[p.section];
              return (
                <View key={p.key} style={styles.part}>
                  <View style={[styles.partIcon, { backgroundColor: st.color }]}>
                    <Ionicons name={st.icon} size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="small" style={{ fontWeight: '700' }}>
                      {p.label}
                    </AppText>
                    <AppText variant="caption" color={colors.mutedForeground}>
                      {p.scoringMethod === 'PER_QUESTION' ? `${p.questionCount} Fragen` : p.module === 'ORAL' ? 'Mündliche Übung' : 'Freie Aufgabe, wird beurteilt'}
                    </AppText>
                  </View>
                  <AppText variant="small" style={{ fontWeight: '800' }}>
                    {p.module === 'ORAL' && !profile.oralScoringEnabled ? 'Übung' : `${formatPoints(p.maxPoints)} P.`}
                  </AppText>
                </View>
              );
            })
          )}
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <View style={styles.pointsHead}>
          <AppText variant="subheading">Wo die Punkte liegen</AppText>
          <AppText variant="caption" color={colors.mutedForeground}>{formatPoints(profile.writtenMaxPoints)} Punkte schriftlich</AppText>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel={`Punkteverteilung, bestanden ab ${formatPoints(profile.writtenPassThreshold)} von ${formatPoints(writtenTotal)} Punkten`} style={{ paddingTop: 20 }}>
          <View style={styles.points}>
            {written.map((p) => (
              <Pressable
                key={p.key}
                accessibilityLabel={`${p.label}: ${formatPoints(p.maxPoints)} Punkte`}
                onPress={() => setSelected(Math.max(0, profile.stages.findIndex((s) => s.partKeys.includes(p.key))))}
                style={{ flexGrow: p.maxPoints, flexBasis: 0, minWidth: 2, backgroundColor: SIM_SECTION[p.section].color, opacity: stage?.partKeys.includes(p.key) ? 1 : 0.35 }}
              />
            ))}
          </View>
          <View pointerEvents="none" style={[styles.marker, { left: `${pass}%` }]}>
            <AppText variant="caption" color="#1B7A55" style={styles.markerText}>
              ab {formatPoints(profile.writtenPassThreshold)}
            </AppText>
            <View style={styles.markerLine} />
          </View>
        </View>
        <View style={styles.legend}>
          {Array.from(new Set(written.map((p) => p.section))).map((sec) => (
            <View key={sec} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: SIM_SECTION[sec].color }]} />
              <AppText variant="caption" color={colors.mutedForeground}>
                {SIM_SECTION[sec].label}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 4, height: 64 },
  segment: { flexBasis: 0, minWidth: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { borderWidth: 2, borderColor: colors.ink, transform: [{ translateY: -2 }] },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  detail: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  part: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface },
  partIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pointsHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  points: { flexDirection: 'row', height: 28, gap: 2, borderRadius: radius.sm, overflow: 'hidden' },
  marker: { position: 'absolute', top: 0, bottom: 0, width: 0, alignItems: 'center' },
  markerText: { width: 80, textAlign: 'center', fontWeight: '800' },
  markerLine: { flex: 1, width: 2, backgroundColor: '#1B7A55' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
