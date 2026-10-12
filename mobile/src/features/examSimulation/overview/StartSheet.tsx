import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Props = { visible: boolean; totalMinutes: number; starting: boolean; color: string; onStart: () => void; onClose: () => void };

/** A short pre-flight checklist before the clock starts. It never blocks: it only makes the learner think about the conditions. */
export function StartSheet({ visible, totalMinutes, starting, color, onStart, onClose }: Props) {
  const items: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: 'timer-outline', text: `Ich habe etwa ${totalMinutes} Minuten ungestört Zeit.` },
    { icon: 'headset-outline', text: 'Kopfhörer oder Lautsprecher funktionieren, der Ton ist an.' },
    { icon: 'volume-mute-outline', text: 'Ich bin an einem ruhigen Ort, Benachrichtigungen sind aus.' },
    { icon: 'warning-outline', text: 'Ich weiß: Ist ein Abschnitt beendet, gibt es kein Zurück.' },
  ];
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
  const ready = checked.filter(Boolean).length;
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Bereit für die Prüfung?" tall>
      <AppText color={colors.mutedForeground}>Der Bildschirm bleibt während der Prüfung an. Mit „…“ oben rechts kannst du eine Pause machen – dann steht die Zeit.</AppText>
      <View style={{ gap: spacing.sm }}>
        {items.map(({ icon, text }, i) => (
          <Pressable
            key={text}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: checked[i] }}
            onPress={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
            style={[styles.item, checked[i] && { borderColor: color, backgroundColor: `${color}14` }]}
          >
            <View style={[styles.box, checked[i] && { backgroundColor: color, borderColor: color }]}>
              {checked[i] ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
            </View>
            <Ionicons name={icon} size={20} color={colors.mutedForeground} />
            <AppText variant="small" style={{ flex: 1 }}>
              {text}
            </AppText>
          </Pressable>
        ))}
      </View>
      <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '700' }}>
        {ready}/{items.length} bestätigt
      </AppText>
      <Button pill color={color} label={ready === items.length ? 'Los geht’s' : 'Trotzdem starten'} loading={starting} onPress={onStart} />
      <Button pill variant="secondary" label="Noch nicht" disabled={starting} onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  box: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
