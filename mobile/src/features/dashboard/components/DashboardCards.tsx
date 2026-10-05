import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, ListItem, ProgressBar, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { DashboardResponse } from '@/types/dashboard';
import { toMobileHref } from '../routes';
import { PLAN_LABEL, continueCopy, focusCopy, isNewLearner, reviewSummary, weekDays } from '../viewModel';

type Props = { data: DashboardResponse };

export function ContinueCard({ data }: Props) {
  const router = useRouter();
  const c = data.continueLearning;
  const isStart = isNewLearner(data);
  const copy = continueCopy(c, isStart);
  return (
    <Card tone="accent" style={styles.hero}>
      <AppText variant="caption" color={colors.primaryDark}>
        {isStart ? 'SO STARTEST DU' : 'WEITERLERNEN'}
      </AppText>
      <View style={styles.row}>
        <AppText style={styles.emoji} accessibilityElementsHidden>
          {copy.emoji}
        </AppText>
        <View style={styles.flex}>
          <AppText variant="heading">{copy.title}</AppText>
          <AppText color={colors.mutedForeground}>{copy.description}</AppText>
        </View>
      </View>
      {c.progressPercent != null ? (
        <View style={styles.gap}>
          <ProgressBar value={c.progressPercent} label={`${Math.round(c.progressPercent)} Prozent abgeschlossen`} />
          <AppText variant="small" color={colors.mutedForeground}>
            {Math.round(c.progressPercent)}% abgeschlossen
          </AppText>
        </View>
      ) : null}
      <Button label={copy.cta} onPress={() => router.push(toMobileHref(c.route, isStart ? '/learn/daily-words' : '/learn'))} />
    </Card>
  );
}

export function TodayPlanCard({ data }: Props) {
  const router = useRouter();
  const { completed, total, activities } = data.today;
  if (total === 0) return null;
  const next = activities.find((a) => !a.completed);
  return (
    <Card>
      <SectionHeader title="Today's Plan" />
      <AppText variant="small" color={colors.mutedForeground}>
        {completed} / {total} abgeschlossen
      </AppText>
      <ProgressBar value={completed} max={total} label={`${completed} von ${total} Aktivitäten abgeschlossen`} />
      {activities.map((a) => (
        <ListItem
          key={a.type}
          title={PLAN_LABEL[a.type]}
          leading={<AppText style={styles.mark}>{a.completed ? '✓' : '○'}</AppText>}
          trailing={<Badge label={a.completed ? 'Erledigt' : 'Offen'} tone={a.completed ? 'success' : 'neutral'} />}
          onPress={() => router.push(toMobileHref(a.route))}
        />
      ))}
      {next ? (
        <Button label="Weiter" onPress={() => router.push(toMobileHref(next.route))} />
      ) : (
        <AppText center color={colors.mutedForeground}>
          🎉 Alles geschafft für heute.
        </AppText>
      )}
    </Card>
  );
}

export function ReviewCard({ data }: Props) {
  const router = useRouter();
  const { wordsDue, expressionsDue } = data.review;
  const due = wordsDue + expressionsDue;
  return (
    <Card>
      <SectionHeader title="🔄 Review Needed" />
      {due > 0 ? (
        <>
          <AppText variant="subheading">{reviewSummary(wordsDue, expressionsDue)}</AppText>
          <AppText color={colors.mutedForeground}>Diese Inhalte sind bereit für eine Wiederholung.</AppText>
          <Button label="Jetzt wiederholen" onPress={() => router.push('/learn/review')} />
        </>
      ) : (
        <>
          <AppText color={colors.mutedForeground}>🎉 Du hast momentan keine Wörter zur Wiederholung.</AppText>
          <Button label="Neue Wörter lernen" variant="secondary" onPress={() => router.push('/learn/daily-words')} />
        </>
      )}
    </Card>
  );
}

export function FocusCard({ data }: Props) {
  const router = useRouter();
  const copy = focusCopy(data.focus);
  if (!copy) return null;
  return (
    <Card>
      <SectionHeader title="🎯 Dein aktueller Fokus" />
      <AppText variant="subheading">{copy.area}</AppText>
      <AppText color={colors.mutedForeground}>{copy.text}</AppText>
      <Button label={copy.cta} variant="secondary" onPress={() => router.push(toMobileHref(data.focus.route))} />
    </Card>
  );
}

export function WeekCard({ data, today = new Date() }: Props & { today?: Date }) {
  const router = useRouter();
  const { days, learningDays, totalDays } = data.week;
  const summary = `${learningDays} von ${totalDays} Tagen gelernt in den letzten 7 Tagen`;
  return (
    <Card>
      <SectionHeader title="Diese Woche" />
      <View accessible accessibilityLabel={summary} style={styles.weekRow}>
        {weekDays(days, today).map((d, i) => (
          <View key={i} style={styles.dayCol}>
            <AppText variant="caption" color={colors.mutedForeground}>
              {d.label}
            </AppText>
            {/* Learned = filled with a check; not learned = hollow. Never color alone. */}
            <View style={[styles.dot, d.learned && styles.dotOn, d.isToday && styles.dotToday]}>
              {d.learned ? <AppText variant="caption" color={colors.primaryForeground}>✓</AppText> : null}
            </View>
          </View>
        ))}
      </View>
      <AppText variant="small" color={colors.mutedForeground}>
        {learningDays} / {totalDays} Lerntage
      </AppText>
      <Button label="Fortschritt ansehen" variant="ghost" onPress={() => router.push('/progress')} />
    </Card>
  );
}

export function MilestoneCard({ data }: Props) {
  const m = data.milestone;
  if (!m) return null;
  return (
    <Card tone="accent">
      <AppText variant="subheading">🏆 {m.wordsMastered} Wörter gemeistert</AppText>
      <ProgressBar value={m.wordsMastered} max={m.nextThreshold} label={`Nächstes Ziel: ${m.nextThreshold} Wörter`} />
      <AppText variant="small" color={colors.mutedForeground}>
        Nächstes Ziel: {m.nextThreshold} Wörter
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md, padding: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  gap: { gap: spacing.xs },
  emoji: { fontSize: 36, lineHeight: 44 },
  mark: { fontSize: 20, width: 28, textAlign: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: spacing.xs },
  dot: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  dotToday: { borderColor: colors.primary },
});
