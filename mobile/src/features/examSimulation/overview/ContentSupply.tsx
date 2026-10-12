import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card, ProgressBar } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ProfileOverview } from '@/types/examSimulation';
import { SIM_SECTION } from '../format';

/** How many tasks are still unused for the learner per part. Collapsed unless stock runs low. */
export function ContentSupply({ profile }: { profile: ProfileOverview }) {
  const low = profile.parts.filter((p) => p.unused < p.required);
  const [open, setOpen] = useState(low.length > 0);
  return (
    <Card style={{ gap: spacing.md }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={styles.head}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="subheading">Neue Aufgaben für dich</AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            Jede Aufgabe bekommst du nur einmal. {low.length > 0 ? `Knapp: ${low.length} ${low.length === 1 ? 'Teil' : 'Teile'}.` : 'Genug für die nächste Prüfung.'}
          </AppText>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mutedForeground} />
      </Pressable>
      {open ? (
        <View style={{ gap: spacing.md }}>
          {profile.parts.map((p) => {
            const short = p.unused < p.required;
            return (
              <View key={p.key} style={{ gap: 4 }}>
                <View style={styles.head}>
                  <AppText variant="small" style={{ flex: 1 }} numberOfLines={1}>
                    {p.label}
                  </AppText>
                  <AppText variant="small" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }} color={short ? colors.destructive : colors.foreground}>
                    {p.unused} von {p.eligible}
                  </AppText>
                </View>
                <ProgressBar value={p.unused} max={Math.max(1, p.eligible)} color={short ? colors.destructive : SIM_SECTION[p.section].color} label={`${p.label}: ${p.unused} von ${p.eligible} unbenutzt`} />
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({ head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 32 } });
