import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Chip } from '@/components/ui';
import { IntroHero } from '@/features/onboarding/IntroHero';
import { colors, radius, spacing } from '@/theme';
import { FOCUS_OPTIONS } from './options';
import type { Focus } from './plan';

type Props = { targetLevel: string; focus: Focus[]; dailyWords: number; onStart: () => void };

/** Shown once the plan is saved: a summary of what was chosen, then into the app. */
export function OnboardingComplete({ targetLevel, focus, dailyWords, onStart }: Props) {
  const chosen = FOCUS_OPTIONS.filter((o) => focus.includes(o.value));
  return (
    <View style={styles.root}>
      <IntroHero />
      <SafeAreaView edges={['bottom']} style={styles.body}>
        <View style={styles.text}>
          <AppText style={styles.title} accessibilityRole="header">
            Dein Lernplan ist fertig!
          </AppText>
          <AppText color={colors.mutedForeground}>
            Du arbeitest auf <AppText style={styles.bold}>{targetLevel}</AppText> hin.
          </AppText>
          {chosen.length ? (
            <View style={styles.focus}>
              <AppText variant="small" color={colors.mutedForeground}>
                Darauf konzentrieren wir uns:
              </AppText>
              <View style={styles.chips}>
                {chosen.map((o) => (
                  <Chip key={o.value} label={o.label} selected />
                ))}
              </View>
            </View>
          ) : null}
          <View style={styles.goal}>
            <AppText variant="small" color={colors.mutedForeground}>
              Dein tägliches Wortziel
            </AppText>
            <AppText style={styles.goalValue}>{dailyWords} Wörter</AppText>
          </View>
        </View>
        <Button pill label="Jetzt lernen" onPress={onStart} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  text: { gap: spacing.md, marginTop: spacing.xl },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.ink },
  bold: { fontWeight: '700', color: colors.ink },
  focus: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  goal: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
    alignItems: 'center',
  },
  goalValue: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.primaryDark },
});
