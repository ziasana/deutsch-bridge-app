import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, DirectionalIcon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { colors, radius, shadow, spacing } from '@/theme';
import type { DashboardResponse } from '@/types/dashboard';
import { useAuthStore } from '@/stores/authStore';
import { useRedemittelHub, useTodayPreview } from '@/features/redemittel/hooks';
import { REDEMITTEL_COLOR } from '@/features/redemittel/meta';
import { useExamWeekSummary, usePendingBookmarkCount } from '../hooks';

/** A tappable pill that points at something new or waiting. */
function Banner({
  icon,
  color,
  title,
  detail,
  cta,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  detail?: string;
  cta: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.banner,
        { backgroundColor: tint(color, '14'), borderColor: tint(color, '33') },
      ]}
    >
      <View style={[styles.bannerIcon, { backgroundColor: tint(color, '33') }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="small" style={{ fontWeight: '700' }} color={colors.ink}>
          {title}
        </AppText>
        {detail ? (
          <AppText variant="caption" color={colors.mutedForeground}>
            {detail}
          </AppText>
        ) : null}
      </View>
      <View style={styles.bannerCta}>
        <AppText variant="caption" color={color} style={{ fontWeight: '800' }}>
          {cta}
        </AppText>
        <DirectionalIcon name="chevron-forward" size={14} color={color} />
      </View>
    </PressableScale>
  );
}

/** "n new lessons, texts and expressions": what the content team added since the learner's last visit. */
export function NewContentBanner({ data }: { data: DashboardResponse }) {
  const router = useRouter();
  const { t } = useI18n();
  const b = t.home.banners;
  const n = data.newContent;
  if (!n || n.total <= 0) return null;
  const parts = [
    n.grammarLessons > 0 ? b.grammarLessons(n.grammarLessons) : null,
    n.readingArticles > 0 ? b.readingTexts(n.readingArticles) : null,
    n.expressions > 0 ? t.home.expression(n.expressions) : null,
  ].filter(Boolean);
  return (
    <Banner
      icon="sparkles"
      color="#8B5CF6"
      title={n.total === 1 ? b.newOne : b.newMany(n.total)}
      detail={parts.join(' · ')}
      cta={b.view}
      label={b.viewLabel}
      onPress={() => router.push('/learn')}
    />
  );
}

/** Reminder for bookmarked grammar lessons that are still open. Renders nothing when there are none. */
export function SavedLessonsBanner() {
  const router = useRouter();
  const { t } = useI18n();
  const b = t.home.banners;
  const count = usePendingBookmarkCount().data ?? 0;
  if (count === 0) return null;
  return (
    <Banner
      icon="bookmark"
      color={colors.primary}
      title={count === 1 ? b.savedOne : b.savedMany(count)}
      cta={b.learn}
      label={b.savedLabel}
      onPress={() => router.push('/learn/grammar')}
    />
  );
}

const SHORTCUTS = [
  { key: 'vocab', emoji: '📚', label: 'words', href: '/learn/vocabulary', color: '#7FAE1B' },
  { key: 'grammar', emoji: '🧱', label: 'grammar', href: '/learn/grammar', color: '#4D94FF' },
  { key: 'reading', emoji: '📖', label: 'reading', href: '/learn/reading', color: '#8B5CF6' },
  { key: 'expr', emoji: '💬', label: 'expressions', href: '/learn/expressions', color: '#27AE7A' },
  { key: 'exam', emoji: '🎯', label: 'exam', href: '/exam', color: '#EC3E4E' },
] as const;

/** One-tap entry to every learning area: five icons share one card, no sideways scrolling. */
export function QuickAccess() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <View style={styles.card}>
      <AppText style={styles.sectionTitle} accessibilityRole="header">
        {t.home.quick.title}
      </AppText>
      <View style={styles.shortcuts}>
        {SHORTCUTS.map((s) => (
          <PressableScale
            key={s.key}
            accessibilityRole="button"
            accessibilityLabel={t.home.quick.open(t.home.quick[s.label])}
            onPress={() => router.push(s.href)}
            containerStyle={{ flex: 1 }}
            style={styles.shortcut}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: tint(s.color, '1F') }]}>
              <AppText style={{ fontSize: 24, lineHeight: 30 }}>{s.emoji}</AppText>
            </View>
            <AppText
              variant="caption"
              style={{ fontWeight: '700' }}
              color={colors.ink}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t.home.quick[s.label]}
            </AppText>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

/** Streak, learning days this week and mastered words in one calm card, split by thin dividers. */
export function StatsRow({ data }: { data: DashboardResponse }) {
  const { t } = useI18n();
  const items = [
    {
      icon: 'flame' as const,
      color: '#F5762B',
      value: String(data.currentStreak),
      label: data.currentStreak === 1 ? t.home.stats.streakOne : t.home.stats.streakMany,
    },
    {
      icon: 'calendar' as const,
      color: colors.primary,
      value: `${data.week.learningDays} / ${data.week.totalDays}`,
      label: t.home.stats.learningDays,
    },
    {
      icon: 'trophy' as const,
      color: '#E8A21A',
      value: String(data.milestone?.wordsMastered ?? 0),
      label: t.home.stats.mastered,
    },
  ];
  return (
    <View style={[styles.card, styles.statsCard]}>
      {items.map((it, i) => (
        <View key={it.label} style={styles.statWrap}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <View accessible accessibilityLabel={`${it.label}: ${it.value}`} style={styles.stat}>
            <Ionicons name={it.icon} size={22} color={it.color} />
            <AppText style={styles.statValue}>{it.value}</AppText>
            <AppText variant="caption" color={colors.mutedForeground} numberOfLines={1}>
              {it.label}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Redemittel tile: what is due and what is new, with a few new phrases visible. It renders nothing
 * when there is nothing to do, so it never competes with a more urgent learning activity.
 */
export function RedemittelHomeCard() {
  const router = useRouter();
  const { t } = useI18n();
  const hub = useRedemittelHub().data;
  const today = useTodayPreview(!!hub && hub.newToday > 0).data;
  if (!hub || (hub.dueCount === 0 && hub.newToday === 0)) return null;
  const due = hub.dueCount > 0;
  const cta = due ? t.home.redemittel.practice : t.home.redemittel.learn;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t.home.redemittel.label(cta)}
      onPress={() => router.push(due ? '/redemittel/review' : '/redemittel/learn')}
      style={[
        styles.redemittel,
        {
          backgroundColor: tint(REDEMITTEL_COLOR, '14'),
          borderColor: tint(REDEMITTEL_COLOR, '33'),
        },
      ]}
    >
      <View style={styles.redemittelHead}>
        <View style={[styles.examIcon, { backgroundColor: tint(REDEMITTEL_COLOR, '33') }]}>
          <AppText style={{ fontSize: 24, lineHeight: 30 }}>🗣️</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={{ fontSize: 20, lineHeight: 26, fontWeight: '700' }} color={colors.ink}>
            Redemittel
          </AppText>
          {hub.dueCount > 0 ? (
            <AppText variant="small" color={colors.ink}>
              {t.learn.redemittelDue(hub.dueCount)}
            </AppText>
          ) : null}
          {hub.newToday > 0 ? (
            <AppText variant="small" color={colors.ink}>
              {t.learn.redemittelNew(hub.newToday)}
            </AppText>
          ) : null}
        </View>
        <View style={styles.redemittelCta}>
          <AppText variant="small" color="#FFFFFF" style={{ fontWeight: '800' }}>
            {cta}
          </AppText>
        </View>
      </View>
      {today && today.length > 0 ? (
        <View style={styles.redemittelChips}>
          {today.slice(0, 3).map((r) => (
            <View key={r.id} style={styles.redemittelChip}>
              <AppText
                variant="caption"
                style={{ fontWeight: '700' }}
                color={colors.ink}
                numberOfLines={1}
              >
                {r.phrase}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </PressableScale>
  );
}

/** TELC learners: how many timed exam exercises they finished this week, linking to the time analysis. */
export function ExamInsightCard() {
  const router = useRouter();
  const { t } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const level = profile?.examLevel;
  const telc = profile?.examType === 'TELC' && !!level;
  const week = useExamWeekSummary(telc);
  if (!telc || !level) return null;
  const count = week.data?.timedExercisesThisWeek;
  let message = t.home.exam.none;
  if (count === 1) message = t.home.exam.one;
  else if (count != null && count > 1) message = t.home.exam.many(count);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t.home.exam.title(level)}
      onPress={() => router.push({ pathname: '/exam-prep/zeitmanagement', params: { level } })}
      style={styles.exam}
    >
      <View style={styles.examIcon}>
        <Ionicons name="timer-outline" size={26} color="#EC3E4E" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ fontWeight: '800' }} color={colors.ink}>
          {t.home.exam.title(level)}
        </AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {message}
        </AppText>
      </View>
      <DirectionalIcon name="chevron-forward" size={20} color="#EC3E4E" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  shortcuts: { flexDirection: 'row', gap: spacing.xs },
  shortcut: { alignItems: 'center', gap: spacing.xs },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: { flexDirection: 'row', paddingVertical: spacing.lg, gap: 0 },
  statWrap: { flex: 1, flexDirection: 'row' },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.ink },
  exam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    ...shadow.card,
  },
  redemittel: { gap: spacing.md, padding: spacing.lg, borderRadius: 28, borderWidth: 1.5 },
  redemittelHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  redemittelCta: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: REDEMITTEL_COLOR,
  },
  redemittelChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  redemittelChip: {
    maxWidth: '100%',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFFCC',
  },
  examIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tint('#EC3E4E', '1F'),
  },
});
