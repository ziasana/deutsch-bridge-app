import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  AppText,
  Button,
  Card,
  DirectionalIcon,
  EmptyState,
  ErrorState,
  ListItem,
  ProgressBar,
  ProgressRing,
  SkyScreen,
  Skeleton,
} from '@/components/ui';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { useI18n } from '@/i18n';
import { detectDir } from '@/i18n/direction';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import type { ExamSection } from '@/types/exam';
import { pickInitialLevel } from '@/utils/levels';
import { ExerciseRow } from './components/ExerciseRow';
import { PressableScale, darken, tint } from './components/kit';
import { WritingLearnCard } from './writing/WritingLearnCard';
import {
  averageScore,
  exercisesForSectionAndLevel,
  findContinueTarget,
  groupIntoParts,
  masteredCount,
} from './examData';
import { useExamText } from './examText';
import { SECTION_META, SECTION_ORDER } from './examMeta';
import {
  useExamExercises,
  useExamLevelSummary,
  usePendingExamBookmarks,
  useToggleExamBookmark,
} from './hooks';
import { useExerciseLastTimes } from './time/hooks';
import { TeilTimeCard } from './time/TeilTimeCard';
import { SectionIcon } from './components/SectionIcon';

/** CEFR levels offered in the picker; levels without content stay visible so the learner sees the whole ladder. */
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

type LevelSummary = { level: string; mastered: number; total: number; avgScore: number };

/** One level as a pill: big letter + number, a mini progress bar underneath. Empty levels are dimmed. */
function LevelPill({
  level,
  summary,
  selected,
  onPress,
}: {
  level: string;
  summary?: LevelSummary;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const total = summary?.total ?? 0;
  const mastered = summary?.mastered ?? 0;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const empty = total === 0;
  return (
    <PressableScale
      containerStyle={{ flex: 1 }}
      accessibilityRole="button"
      accessibilityLabel={`${level} · ${mastered}/${total}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.pill, selected && styles.pillOn, empty && !selected && { opacity: 0.55 }]}
    >
      <AppText style={[styles.pillLevel, selected && { color: '#FFFFFF' }]}>{level}</AppText>
      <View style={[styles.pillTrack, selected && { backgroundColor: 'rgba(255,255,255,0.35)' }]}>
        <View
          style={[
            styles.pillFill,
            { width: `${pct}%`, backgroundColor: selected ? '#FFFFFF' : colors.success },
          ]}
        />
      </View>
      <AppText variant="caption" color={selected ? '#FFFFFF' : colors.mutedForeground}>
        {empty ? t.examHub.soon : `${mastered}/${total}`}
      </AppText>
    </PressableScale>
  );
}

/**
 * The floating card at the top: first the exam level (always visible, A1–C1), then how far the
 * learner is at that level. Picking a level re-scopes everything below, including the sections.
 */
function ReadinessCard({
  level,
  summaries,
  loading,
  onPick,
}: {
  level: string | null;
  summaries: LevelSummary[];
  loading: boolean;
  onPick: (level: string) => void;
}) {
  const { t } = useI18n();
  const h = t.examHub;
  const current = summaries.find((s) => s.level === level);
  const levels = [
    ...CEFR_LEVELS,
    ...summaries.map((s) => s.level).filter((l) => !CEFR_LEVELS.includes(l)),
  ];
  return (
    <View style={styles.ready}>
      <View style={styles.readyHead}>
        <AppText style={styles.readyKicker}>{h.kicker}</AppText>
        <AppText variant="caption" color={colors.mutedForeground}>
          {h.chooseLevel}
        </AppText>
      </View>
      <View style={styles.pills} accessibilityRole="tablist">
        {levels.map((l) => (
          <LevelPill
            key={l}
            level={l}
            summary={summaries.find((s) => s.level === l)}
            selected={l === level}
            onPress={() => onPick(l)}
          />
        ))}
      </View>
      <View style={styles.readyDivider} />
      {loading ? (
        <Skeleton height={72} />
      ) : (
        <View style={styles.readyTop}>
          <ProgressRing
            value={current?.avgScore ?? 0}
            size={72}
            stroke={8}
            color={colors.primary}
            textSize={17}
            label={h.levelRing(level ?? '')}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.readyTitle}>
              {h.levelTitle(level ?? '–', current?.mastered ?? 0, current?.total ?? 0)}
            </AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              {current && current.total > 0 ? h.levelAverage(current.avgScore) : h.levelEmpty}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}

/** Long section names break at a soft hyphen instead of being cut off. */
const BUBBLE_LABEL: Partial<Record<ExamSection, string>> = {
  SPRACHBAUSTEINE: 'Sprach\u00ADbausteine',
};

const BUBBLE = 64;
const BUBBLE_STROKE = 5;

/** A section as a round bubble: the progress arc runs around the icon; the label sits underneath. */
function SectionBubble({
  section,
  mastered,
  total,
  selected,
  onPress,
}: {
  section: ExamSection;
  mastered: number;
  total: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const tx = useExamText();
  const meta = SECTION_META[section];
  const label = tx(meta.label);
  const color = meta.color;
  const [scale] = useState(() => new Animated.Value(1));
  const spring = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      friction: 7,
      tension: 220,
      useNativeDriver: true,
    }).start();
  const pct = total > 0 ? Math.min(100, Math.round((mastered / total) * 100)) : 0;
  const r = (BUBBLE - BUBBLE_STROKE) / 2;
  const c = 2 * Math.PI * r;
  const done = !meta.informational && total > 0 && mastered === total;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          meta.informational
            ? `${meta.emoji} ${label}`
            : `${meta.emoji} ${t.examHub.bubbleLabel(label, mastered, total)}`
        }
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={() => spring(0.93)}
        onPressOut={() => spring(1)}
        style={[styles.bubbleWrap, selected && { backgroundColor: tint(color, '14') }]}
      >
        <View style={{ width: BUBBLE, height: BUBBLE }}>
          <Svg width={BUBBLE} height={BUBBLE} style={StyleSheet.absoluteFill}>
            <Circle
              cx={BUBBLE / 2}
              cy={BUBBLE / 2}
              r={r}
              stroke={meta.informational ? colors.border : tint(color, '33')}
              strokeWidth={BUBBLE_STROKE}
              fill={selected ? tint(color, '1F') : '#FFFFFF'}
            />
            {!meta.informational && pct > 0 ? (
              <Circle
                cx={BUBBLE / 2}
                cy={BUBBLE / 2}
                r={r}
                stroke={color}
                strokeWidth={BUBBLE_STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${c} ${c}`}
                strokeDashoffset={c * (1 - pct / 100)}
                transform={`rotate(-90 ${BUBBLE / 2} ${BUBBLE / 2})`}
              />
            ) : null}
          </Svg>
          <View style={styles.bubbleIcon}>
            <SectionIcon section={section} size={28} />
          </View>
          {done ? (
            <View style={styles.bubbleCheck}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <AppText
          style={[styles.bubbleLabel, selected && { color: colors.ink, fontWeight: '800' }]}
          numberOfLines={2}
        >
          {label === meta.label ? (BUBBLE_LABEL[section] ?? label) : label}
        </AppText>
        <AppText variant="caption" color={colors.mutedForeground} numberOfLines={1}>
          {meta.informational ? t.examHub.info : `${mastered}/${total}`}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

/** One exam part: numbered node, title, progress bar in the section colour, chevron / check. */
function PartCard({
  emoji,
  label,
  color,
  done,
  mastered,
  total,
  avg,
  onPress,
}: {
  emoji: ReactNode;
  label: string;
  color: string;
  done: boolean;
  mastered: number;
  total: number;
  avg: number;
  onPress: () => void;
}) {
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.examHub.partLabel(label, mastered, total)}
      onPress={onPress}
      style={({ pressed }) => [styles.part, pressed && { backgroundColor: tint(color, '14') }]}
    >
      <View style={[styles.partNode, { backgroundColor: tint(color, '1F') }]}>
        {typeof emoji === 'string' ? <AppText style={styles.partEmoji}>{emoji}</AppText> : emoji}
        {done ? (
          <View style={styles.partCheck}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <View style={styles.partBody}>
        <AppText style={styles.partTitle}>{label}</AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {t.examHub.partCount(mastered, total, avg)}
        </AppText>
        <ProgressBar
          value={avg}
          color={done ? colors.success : color}
          label={t.examHub.partProgress(label)}
        />
      </View>
      <DirectionalIcon name="chevron-forward" size={24} color={colors.mutedForeground} />
    </Pressable>
  );
}

export function ExamHubScreen() {
  const router = useRouter();
  const { t, dir } = useI18n();
  const tx = useExamText();
  const h = t.examHub;
  const profileLevel = useAuthStore((s) => s.profile?.learningLevel);
  const summary = useExamLevelSummary();
  const pending = usePendingExamBookmarks();
  const bookmark = useToggleExamBookmark();
  const [section, setSection] = useState<ExamSection>('LESEVERSTEHEN');
  const [pickedLevel, setPickedLevel] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const summaries = useMemo(() => summary.data ?? [], [summary.data]);
  const level = pickedLevel ?? pickInitialLevel(profileLevel, summaries);
  const exercises = useExamExercises(level);

  const meta = SECTION_META[section];
  const color = meta.color;
  const term = search.trim().toLowerCase();
  const items = useMemo(
    () =>
      level && exercises.data ? exercisesForSectionAndLevel(exercises.data, section, level) : [],
    [exercises.data, section, level],
  );
  const groups = useMemo(
    () =>
      groupIntoParts(items, section).filter(
        (g) =>
          term === '' ||
          g.label.toLowerCase().includes(term) ||
          tx(g.label).toLowerCase().includes(term) ||
          g.items.some(
            (i) => i.title.toLowerCase().includes(term) || tx(i.title).toLowerCase().includes(term),
          ),
      ),
    [items, section, term, tx],
  );
  // Schreiben has no Teile: its Übungen are listed directly.
  const isFlat = section === 'SCHRIFTLICHER_AUSDRUCK';
  const flatItems = isFlat
    ? (groupIntoParts(items, section)[0]?.items ?? []).filter(
        (i) => term === '' || i.title.toLowerCase().includes(term),
      )
    : [];
  const lastTimes = useExerciseLastTimes(isFlat ? section : null, level);
  const infoItems = meta.informational
    ? items.filter((i) => term === '' || i.title.toLowerCase().includes(term))
    : [];
  const target =
    level && exercises.data && !meta.informational
      ? findContinueTarget(exercises.data, level, section)
      : null;

  const openExercise = (id: string) =>
    router.push({ pathname: '/exam-prep/exercise/[exerciseId]', params: { exerciseId: id } });
  const openPart = (key: string, firstId: string, only: boolean) => {
    if (only) openExercise(firstId);
    else
      router.push({ pathname: '/exam-prep/teil', params: { section, level: level!, part: key } });
  };

  const sectionStats = (s: ExamSection) => {
    const list =
      level && exercises.data ? exercisesForSectionAndLevel(exercises.data, s, level) : [];
    return { mastered: masteredCount(list), total: list.length, avg: averageScore(list) };
  };
  const stats = sectionStats(section);
  const description = h.descriptions[section];

  // Tapping a section card selects it and brings its parts into view.
  const scrollRef = useRef<ScrollView>(null);
  const partsRef = useRef<View>(null);
  const selectSection = (s: ExamSection) => {
    setSection(s);
    setTimeout(() => {
      const scroller = scrollRef.current;
      if (!scroller || !partsRef.current) return;
      partsRef.current.measureLayout(
        scroller as never,
        (_x, y) => scroller.scrollTo({ y: Math.max(0, y - spacing.lg), animated: true }),
        () => {},
      );
    }, 60);
  };

  let body;
  if (summary.isPending || (!!level && exercises.isPending)) {
    body = (
      <View accessibilityLabel={h.loading} style={{ gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={72} />
        ))}
      </View>
    );
  } else if (summary.isError || exercises.isError) {
    body = (
      <ErrorState
        error={summary.error ?? exercises.error}
        onRetry={() => {
          void summary.refetch();
          void exercises.refetch();
        }}
      />
    );
  } else if (isFlat) {
    body = (
      <View style={{ gap: spacing.md }}>
        {level ? <WritingLearnCard level={level} /> : null}
        <View style={styles.headingRow}>
          <SectionIcon section={section} size={22} />
          <AppText style={styles.heading} accessibilityRole="header">
            {h.writingTasks}
          </AppText>
        </View>
        {level ? (
          <TeilTimeCard
            section={section}
            level={level}
            teil={1}
            showLastResult={false}
            color={color}
          />
        ) : null}
        {flatItems.length > 0 ? (
          <View>
            {flatItems.map((item) => (
              <ExerciseRow
                key={item.id}
                item={item}
                color={color}
                onPress={() => openExercise(item.id)}
                onToggleBookmark={() =>
                  bookmark.mutate({ id: item.id, bookmarked: item.bookmarked })
                }
                bookmarkBusy={bookmark.isPending && bookmark.variables?.id === item.id}
                lastTime={lastTimes[item.id]}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            emoji="✍️"
            title={term ? h.nothingFound : h.noWritingTitle}
            message={term ? h.adjustSearch : h.noWritingMessage}
          />
        )}
      </View>
    );
  } else if (meta.informational) {
    body =
      infoItems.length > 0 ? (
        <View>
          {infoItems.map((i) => (
            <ListItem
              key={i.id}
              title={tx(i.title)}
              subtitle={i.teilDescription ?? undefined}
              trailing={
                <AppText color={i.completed ? colors.success : colors.mutedForeground}>
                  {i.completed ? '✓' : '›'}
                </AppText>
              }
              onPress={() => openExercise(i.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyState emoji="ℹ️" title={h.noInfoTitle} message={h.noInfoMessage} />
      );
  } else if (groups.length === 0) {
    body = (
      <EmptyState
        emoji="🔍"
        title={term ? h.nothingFound : h.noExercisesTitle}
        message={term ? h.adjustSearch : h.noExercisesMessage}
        actionLabel={term ? h.resetSearch : undefined}
        onAction={term ? () => setSearch('') : undefined}
      />
    );
  } else {
    body = (
      <View style={{ gap: spacing.md }}>
        {groups.map((g) => (
          <PartCard
            key={g.key}
            color={color}
            emoji={<SectionIcon section={section} size={28} />}
            label={tx(g.label)}
            done={g.state === 'completed'}
            mastered={g.mastered}
            total={g.total}
            avg={g.avgScore}
            onPress={() => openPart(g.key, g.items[0].id, g.items.length === 1)}
          />
        ))}
      </View>
    );
  }

  const saved = pending.data ?? [];
  const bookmarksCount = saved.length;

  return (
    <SkyScreen
      scrollRef={scrollRef}
      title={h.title}
      subtitle={h.subtitle}
      floating={
        <ReadinessCard
          level={level}
          summaries={summaries}
          loading={summary.isPending}
          onPick={setPickedLevel}
        />
      }
    >
      {target ? (
        <View
          style={[styles.cont, { backgroundColor: tint(SECTION_META[target.section].color, '14') }]}
        >
          <View style={styles.contTop}>
            <View
              style={[
                styles.contIcon,
                { backgroundColor: tint(SECTION_META[target.section].color, '33') },
              ]}
            >
              <SectionIcon section={target.section} size={28} />
            </View>
            <View style={{ flex: 1, gap: 4, alignItems: 'flex-start' }}>
              <AppText variant="small" color={colors.ink} style={{ fontWeight: '700' }}>
                {h.continue(tx(SECTION_META[target.section].label))}
              </AppText>
              <AppText style={styles.contTitle} numberOfLines={2}>
                {tx(target.partLabel)}
              </AppText>
            </View>
          </View>
          <ProgressBar
            value={target.avgScore}
            color={SECTION_META[target.section].color}
            label={h.continueProgress}
          />
          <Button
            pill
            label={
              target.state === 'completed'
                ? h.repeat
                : target.state === 'in_progress'
                  ? h.resume
                  : h.startBtn
            }
            onPress={() => openExercise(target.exerciseId)}
          />
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <AppText style={styles.heading} accessibilityRole="header">
          {h.whatPractise}
        </AppText>
        <HorizontalScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bubbles}
          style={styles.bubblesScroll}
        >
          {SECTION_ORDER.map((sec) => {
            const st = sectionStats(sec);
            return (
              <SectionBubble
                key={sec}
                section={sec}
                mastered={st.mastered}
                total={st.total}
                selected={sec === section}
                onPress={() => selectSection(sec)}
              />
            );
          })}
        </HorizontalScroll>
      </View>

      <View ref={partsRef} collapsable={false} style={{ gap: spacing.md }}>
        <View style={[styles.panel, { backgroundColor: tint(color, '14') }]}>
          <View style={[styles.panelIcon, { backgroundColor: tint(color, '33') }]}>
            <SectionIcon section={section} size={30} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.panelTitleRow}>
              <AppText style={styles.panelTitle} accessibilityRole="header">
                {tx(meta.label)}
              </AppText>
              {level ? (
                <View style={[styles.levelTag, { backgroundColor: color }]}>
                  <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
                    {level}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="small" color={colors.ink}>
              {meta.informational || stats.total === 0
                ? description
                : h.panelLine(stats.mastered, stats.total, stats.avg, description)}
            </AppText>
          </View>
        </View>

        {!meta.informational ? (
          <View style={styles.search}>
            <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
            <TextInput
              accessibilityLabel={h.searchLabel}
              placeholder={h.searchPlaceholder}
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={[
                styles.searchInput,
                { writingDirection: search ? detectDir(search, dir) : dir },
              ]}
            />
            {search ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={h.clearSearch}
                hitSlop={spacing.sm}
                onPress={() => setSearch('')}
              >
                <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {body}
      </View>

      {bookmarksCount > 0 ? (
        <Card style={{ gap: spacing.xs }}>
          <View style={styles.savedHead}>
            <Ionicons name="star" size={20} color={colors.warning} />
            <AppText variant="subheading">{h.savedTitle}</AppText>
          </View>
          <AppText variant="small" color={colors.mutedForeground}>
            {h.savedWaiting(bookmarksCount)}
          </AppText>
          <View style={{ marginTop: spacing.sm }}>
            {saved.slice(0, 3).map((b) => (
              <ExerciseRow
                key={b.id}
                color={SECTION_META[b.section]?.color}
                item={{
                  id: b.id,
                  title: `${tx(SECTION_META[b.section]?.label ?? b.section)}: ${tx(b.title)}`,
                  section: b.section,
                  taskType: null,
                  level: b.level,
                  partNumber: null,
                  teil: null,
                  teilDescription: null,
                  questionsCount: 0,
                  completed: false,
                  lastScore: null,
                  bookmarked: true,
                }}
                onPress={() => openExercise(b.id)}
                onToggleBookmark={() => bookmark.mutate({ id: b.id, bookmarked: true })}
                bookmarkBusy={bookmark.isPending && bookmark.variables?.id === b.id}
              />
            ))}
          </View>
          {bookmarksCount > 3 ? (
            <AppText variant="small" color={colors.mutedForeground}>
              {h.savedMore(bookmarksCount - 3)}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {level ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`⏱ ${h.timeTitle}`}
          onPress={() => router.push({ pathname: '/exam-prep/zeitmanagement', params: { level } })}
          style={({ pressed }) => [
            styles.timeTile,
            pressed && { backgroundColor: tint(color, '14') },
          ]}
        >
          <View style={[styles.timeIcon, { backgroundColor: tint(color, '1F') }]}>
            <Ionicons name="timer-outline" size={26} color={darken(color)} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">{h.timeTitle}</AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              {h.timeSubtitle}
            </AppText>
          </View>
          <DirectionalIcon name="chevron-forward" size={22} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </SkyScreen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  ready: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1D2433',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  readyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readyKicker: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.primaryDark,
  },
  readyDivider: { height: 1, backgroundColor: colors.border },
  readyTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  readyTitle: { fontSize: 17, lineHeight: 23, fontWeight: '800', color: colors.ink },
  pills: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.accent,
  },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillLevel: { fontSize: 20, lineHeight: 24, fontWeight: '800', color: colors.ink },
  pillTrack: {
    width: '70%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  pillFill: { height: '100%', borderRadius: 2 },

  cont: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  contTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contTitle: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: colors.ink },

  // Bleeds to the screen edges so the row scrolls under the page padding.
  bubblesScroll: { marginHorizontal: -spacing.xl },
  bubbles: { gap: spacing.xs, paddingHorizontal: spacing.lg },
  bubbleWrap: {
    width: 92,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleIcon: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleEmoji: { fontSize: 28, lineHeight: 36 },
  bubbleCheck: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleLabel: {
    height: 36,
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginTop: 4,
  },

  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  panelIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelTag: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: radius.pill },
  panelTitle: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.ink },

  search: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, color: colors.foreground },

  part: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  partNode: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partEmoji: { fontSize: 28, lineHeight: 36 },
  partCheck: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partBody: { flex: 1, gap: 4, alignItems: 'flex-start' },
  partTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: colors.ink },

  savedHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  timeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
