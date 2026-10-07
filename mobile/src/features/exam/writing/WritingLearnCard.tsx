import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, ProgressRing } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import { tint } from '../components/kit';
import { useLearnSummary } from './learn/useLearnSummary';
import { WRITING_COLOR } from './learn/ui';
import { darken } from '@/features/exam/components/kit';

/** Entry to "Schreiben lernen" at the top of the Schreiben section: learn the method, then write. */
export function WritingLearnCard({ level }: { level: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const w = t.examHub.writingLearn;
  const { total, finished } = useLearnSummary(level);
  const open = () => router.push({ pathname: '/exam-prep/schreiben/lernen', params: { level } });
  const started = finished > 0;
  const all = total != null && total > 0 && finished === total;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={w.title}
      accessibilityHint={w.hint}
      onPress={open}
      style={[
        styles.card,
        { backgroundColor: tint(WRITING_COLOR, '14'), borderColor: tint(WRITING_COLOR, '33') },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: tint(WRITING_COLOR, '33') }]}>
          <AppText style={{ fontSize: 30, lineHeight: 38 }}>📚</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={styles.title}>{w.title}</AppText>
          <AppText variant="small" color={colors.ink}>
            {w.description}
          </AppText>
        </View>
        {total ? (
          <ProgressRing
            value={(finished / total) * 100}
            size={52}
            stroke={6}
            textSize={11}
            color={WRITING_COLOR}
            label={w.stations(finished, total)}
          />
        ) : null}
      </View>
      {total ? (
        <AppText variant="small" color={colors.mutedForeground}>
          {all ? w.allStations : w.stations(finished, total)}
        </AppText>
      ) : null}
      <Button pill label={all ? w.again : started ? w.continue : w.learn} onPress={open} color={WRITING_COLOR} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1.5 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.ink },
});
