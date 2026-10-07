import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, DirectionalIcon, ProgressBar, ProgressRing } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import type { DashboardResponse, PlanActivityType } from '@/types/dashboard';
import { toMobileHref } from '../routes';
import {
  continueCopy,
  focusCopy,
  isNewLearner,
  planLabel,
  reviewSummary,
  weekDays,
} from '../viewModel';
import { usePressScale } from './Reveal';
import { SECTION_COLOR } from '@/theme/sectionColors';

type Props = { data: DashboardResponse };

const ACTIVITY_STYLE: Record<PlanActivityType, { emoji: string; color: string }> = {
  DAILY_WORDS: { emoji: '🌱', color: SECTION_COLOR.dailyWords },
  VOCAB_REVIEW: { emoji: '🗂️', color: SECTION_COLOR.review },
  GRAMMAR: { emoji: '🧱', color: SECTION_COLOR.grammar },
  READING: { emoji: '📖', color: SECTION_COLOR.reading },
};

/** Big brand-blue call to action: what to do next, with its progress as a ring. */
export function ContinueCard({ data }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const c = data.continueLearning;
  const isStart = isNewLearner(data);
  const copy = continueCopy(c, t.home, isStart);
  const go = () => router.push(toMobileHref(c.route, isStart ? '/learn/daily-words' : '/learn'));
  return (
    <View style={styles.continueCard}>
      <View style={styles.continueDeco} pointerEvents="none" />
      <AppText variant="caption" color="#DCEAFF" style={styles.eyebrow}>
        {isStart ? t.home.continue.eyebrowStart : t.home.continue.eyebrowContinue}
      </AppText>
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText
            style={styles.continueTitle}
            color="#FFFFFF"
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {copy.title}
          </AppText>
          <AppText color="#E6F0FF" style={styles.continueText}>
            {copy.description}
          </AppText>
        </View>
        {c.progressPercent != null ? (
          <View style={styles.ringWrap}>
            <ProgressRing
              value={c.progressPercent}
              size={78}
              stroke={8}
              color="#FFFFFF"
              textSize={17}
              label={t.home.continue.percentDone(Math.round(c.progressPercent))}
              trackColor="rgba(255,255,255,0.28)"
              textColor="#FFFFFF"
            />
          </View>
        ) : (
          <View style={styles.emojiBubble}>
            <AppText style={styles.emoji} accessibilityElementsHidden>
              {copy.emoji}
            </AppText>
          </View>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.cta}
        onPress={go}
        style={({ pressed }) => [styles.whiteBtn, pressed && { opacity: 0.85 }]}
      >
        <AppText variant="subheading" color={colors.primaryDark}>
          {copy.cta}
        </AppText>
        <DirectionalIcon name="arrow-forward" size={20} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

function ActivityTile({
  type,
  completed,
  onPress,
}: {
  type: PlanActivityType;
  completed: boolean;
  onPress: () => void;
}) {
  const press = usePressScale();
  const { t } = useI18n();
  const { emoji, color } = ACTIVITY_STYLE[type];
  const label = planLabel(type, t.home);
  return (
    <Animated.View style={[styles.tileWrap, { transform: [{ scale: press.scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.home.plan.tileLabel(label, completed)}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[
          styles.tile,
          {
            borderColor: completed ? color : `${color}55`,
            backgroundColor: completed ? `${color}18` : '#FFFFFF',
          },
        ]}
      >
        <View style={[styles.tileIcon, { backgroundColor: completed ? color : `${color}22` }]}>
          {completed ? (
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          ) : (
            <AppText style={styles.tileEmoji}>{emoji}</AppText>
          )}
        </View>
        <AppText
          style={styles.tileLabel}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {label}
        </AppText>
        <AppText
          variant="caption"
          color={completed ? color : colors.mutedForeground}
          style={styles.tileState}
        >
          {completed ? t.home.plan.done : t.home.plan.open}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

export function TodayPlanCard({ data }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const { completed, total, activities } = data.today;
  if (total === 0) return null;
  const next = activities.find((a) => !a.completed);
  const pct = Math.round((completed / total) * 100);
  return (
    <View style={styles.card}>
      <View style={styles.planHead}>
        <ProgressRing
          value={pct}
          size={92}
          stroke={10}
          color={colors.success}
          textSize={20}
          label={t.home.plan.ringLabel(completed, total)}
        />
        <View style={styles.flex}>
          <AppText style={styles.cardTitle} accessibilityRole="header">
            {t.home.plan.title}
          </AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {t.home.plan.completedOf(completed, total)}
          </AppText>
        </View>
      </View>
      <View style={styles.tileGrid}>
        {activities.map((a) => (
          <ActivityTile
            key={a.type}
            type={a.type}
            completed={a.completed}
            onPress={() => router.push(toMobileHref(a.route))}
          />
        ))}
      </View>
      {next ? (
        <Button
          pill
          label={t.home.plan.next}
          onPress={() => router.push(toMobileHref(next.route))}
        />
      ) : (
        <AppText center color={colors.mutedForeground}>
          {t.home.plan.allDone}
        </AppText>
      )}
    </View>
  );
}

function TintCard({
  tint,
  emoji,
  title,
  children,
}: {
  tint: string;
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.tintCard, { backgroundColor: `${tint}12`, borderColor: `${tint}44` }]}>
      <View style={styles.tintHead}>
        <View style={[styles.tintIcon, { backgroundColor: `${tint}26` }]}>
          <AppText style={styles.tileEmoji}>{emoji}</AppText>
        </View>
        <AppText style={styles.cardTitle} accessibilityRole="header" numberOfLines={2}>
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}

export function ReviewCard({ data }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const { wordsDue, expressionsDue } = data.review;
  const due = wordsDue + expressionsDue;
  return (
    <TintCard tint={SECTION_COLOR.review} emoji="🗂️" title={t.home.review.title}>
      {due > 0 ? (
        <>
          <AppText style={styles.big}>{reviewSummary(wordsDue, expressionsDue, t.home)}</AppText>
          <AppText color={colors.mutedForeground}>{t.home.review.ready}</AppText>
          <Button pill label={t.home.review.now} onPress={() => router.push('/learn/review')} />
        </>
      ) : (
        <>
          <AppText color={colors.mutedForeground}>{t.home.review.none}</AppText>
          <Button
            pill
            label={t.home.review.learnNew}
            variant="secondary"
            onPress={() => router.push('/learn/daily-words')}
          />
        </>
      )}
    </TintCard>
  );
}

export function FocusCard({ data }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const copy = focusCopy(data.focus, t.home);
  if (!copy) return null;
  return (
    <TintCard tint="#E8832E" emoji="🎯" title={t.home.focus.title}>
      <AppText style={styles.big}>{copy.area}</AppText>
      <AppText color={colors.mutedForeground}>{copy.text}</AppText>
      <Button
        pill
        label={copy.cta}
        variant="secondary"
        onPress={() => router.push(toMobileHref(data.focus.route))}
      />
    </TintCard>
  );
}

function TodayDot() {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.todayRing,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.2] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
        },
      ]}
    />
  );
}

export function WeekCard({ data, today = new Date() }: Props & { today?: Date }) {
  const router = useRouter();
  const { t } = useI18n();
  const w = t.home.week;
  const { days, learningDays, totalDays } = data.week;
  // Tap a day to see its date and whether you learned (tap again to close).
  const [picked, setPicked] = useState<number | null>(null);
  const summary = w.summary(learningDays, totalDays);
  return (
    <View style={styles.card}>
      <AppText style={styles.cardTitle} accessibilityRole="header">
        {w.title}
      </AppText>
      <View accessible accessibilityLabel={summary} style={styles.weekRow}>
        {weekDays(days, today, t.home).map((d, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={w.dayLabel(d.label, d.learned)}
            accessibilityState={{ selected: picked === i }}
            onPress={() => setPicked(picked === i ? null : i)}
            style={styles.dayCol}
          >
            <AppText
              variant="caption"
              color={d.isToday ? colors.primaryDark : colors.mutedForeground}
              style={d.isToday ? styles.todayLabel : undefined}
            >
              {d.label}
            </AppText>
            {/* Learned = filled with a flame/check; not learned = hollow. Never colour alone. */}
            <View style={styles.dotWrap}>
              {d.isToday && !d.learned ? <TodayDot /> : null}
              <View
                style={[
                  styles.dot,
                  d.learned && styles.dotOn,
                  d.isToday && styles.dotToday,
                  picked === i && styles.dotPicked,
                ]}
              >
                {d.learned ? <Ionicons name="flame" size={18} color="#FFFFFF" /> : null}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
      {picked !== null ? (
        <View style={styles.dayDetail} accessibilityRole="alert">
          <AppText variant="small" style={{ fontWeight: '700' }} color={colors.ink}>
            {(() => {
              const date = new Date(today);
              date.setDate(today.getDate() - (days.length - 1 - picked));
              return w.dayDetail(
                weekDays(days, today, t.home)[picked].label,
                date.getDate(),
                w.months[date.getMonth()],
              );
            })()}
            {' · '}
            {days[picked] ? w.learned : w.notLearned}
          </AppText>
        </View>
      ) : null}
      <AppText variant="small" color={colors.mutedForeground}>
        {w.learningDays(learningDays, totalDays)}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={w.viewProgress}
        onPress={() => router.push('/progress')}
        style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}
      >
        <AppText variant="subheading" color={colors.primaryDark}>
          {w.viewProgress}
        </AppText>
        <DirectionalIcon name="arrow-forward" size={18} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

export function MilestoneCard({ data }: Props) {
  const { t } = useI18n();
  const m = data.milestone;
  if (!m) return null;
  return (
    <View style={styles.milestone}>
      <View style={styles.trophy}>
        <AppText style={styles.trophyEmoji} accessibilityElementsHidden>
          🏆
        </AppText>
      </View>
      <View style={styles.flex}>
        <AppText style={styles.big} color="#FFFFFF">
          {t.home.milestone.mastered(m.wordsMastered)}
        </AppText>
        <ProgressBar
          value={m.wordsMastered}
          max={m.nextThreshold}
          label={t.home.milestone.nextGoal(m.nextThreshold)}
        />
        <AppText variant="small" color="#FFF3D6">
          {t.home.milestone.nextGoal(m.nextThreshold)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 4 },
  eyebrow: { letterSpacing: 1, fontWeight: '700' },
  continueCard: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: 28,
    backgroundColor: colors.brand,
    overflow: 'hidden',
  },
  continueDeco: {
    position: 'absolute',
    end: -40,
    top: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  continueTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  continueText: { fontSize: 15, lineHeight: 21 },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  emojiBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28, lineHeight: 36 },
  whiteBtn: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tileWrap: { width: '47.5%', flexGrow: 1 },
  tile: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  tileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileEmoji: { fontSize: 26, lineHeight: 32 },
  tileLabel: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: colors.ink },
  tileState: { fontWeight: '700' },
  tintCard: { gap: spacing.md, padding: spacing.lg, borderRadius: 28, borderWidth: 1.5 },
  tintHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tintIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: colors.ink },
  linkRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: -spacing.xs,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: spacing.sm },
  todayLabel: { fontWeight: '800' },
  dotWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  todayRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dotOn: { backgroundColor: '#F5762B', borderColor: '#F5762B' },
  dotToday: { borderColor: colors.primary },
  dotPicked: { borderColor: colors.ink, borderWidth: 3 },
  dayDetail: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: '#E8A21A',
  },
  trophy: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyEmoji: { fontSize: 34, lineHeight: 42 },
});
