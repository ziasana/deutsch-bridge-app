import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListItem,
  ProgressBar,
  ProgressRing,
  SkyScreen,
  Skeleton,
} from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import type { ExamSection } from '@/types/exam';
import { pickInitialLevel } from '@/utils/levels';
import { ExerciseRow } from './components/ExerciseRow';
import { PressableScale, tint } from './components/kit';
import {
  averageScore,
  exercisesForSectionAndLevel,
  findContinueTarget,
  groupIntoParts,
  masteredCount,
} from './examData';
import { SECTION_META, SECTION_ORDER } from './examMeta';
import {
  useExamExercises,
  useExamLevelSummary,
  usePendingExamBookmarks,
  useToggleExamBookmark,
} from './hooks';
import { useExerciseLastTimes } from './time/hooks';
import { TeilTimeCard } from './time/TeilTimeCard';

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
        {empty ? 'bald' : `${mastered}/${total}`}
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
  const current = summaries.find((s) => s.level === level);
  const levels = [
    ...CEFR_LEVELS,
    ...summaries.map((s) => s.level).filter((l) => !CEFR_LEVELS.includes(l)),
  ];
  return (
    <View style={styles.ready}>
      <View style={styles.readyHead}>
        <AppText style={styles.readyKicker}>PRÜFUNGSNIVEAU</AppText>
        <AppText variant="caption" color={colors.mutedForeground}>
          Wähle dein Niveau
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
            label={`Stand ${level ?? ''}`}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.readyTitle}>
              {level ?? '–'} · {current?.mastered ?? 0} von {current?.total ?? 0} gemeistert
            </AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              {current && current.total > 0
                ? `Ø Ergebnis ${current.avgScore}% – Ziel: alles auf 100%.`
                : 'Für dieses Niveau gibt es noch keine Übungen.'}
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
  const meta = SECTION_META[section];
  const color = meta.color;
  const [scale] = useState(() => new Animated.Value(1));
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, friction: 7, tension: 220, useNativeDriver: true }).start();
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
            ? `${meta.emoji} ${meta.label}`
            : `${meta.emoji} ${meta.label}, ${mastered} von ${total} Aufgaben gemeistert`
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
            <AppText style={styles.bubbleEmoji}>{meta.emoji}</AppText>
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
          {BUBBLE_LABEL[section] ?? meta.label}
        </AppText>
        <AppText variant="caption" color={colors.mutedForeground} numberOfLines={1}>
          {meta.informational ? 'Info' : `${mastered}/${total}`}
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
  emoji: string;
  label: string;
  color: string;
  done: boolean;
  mastered: number;
  total: number;
  avg: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${mastered} von ${total} Aufgaben gemeistert`}
      onPress={onPress}
      style={({ pressed }) => [styles.part, pressed && { backgroundColor: tint(color, '14') }]}
    >
      <View style={[styles.partNode, { backgroundColor: tint(color, '1F') }]}>
        <AppText style={styles.partEmoji}>{emoji}</AppText>
        {done ? (
          <View style={styles.partCheck}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <View style={styles.partBody}>
        <AppText style={styles.partTitle}>{label}</AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {mastered} / {total} {total === 1 ? 'Übung' : 'Übungen'} · Ø {avg}%
        </AppText>
        <ProgressBar value={avg} color={done ? colors.success : color} label={`${label} Fortschritt`} />
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.mutedForeground} />
    </Pressable>
  );
}

export function ExamHubScreen() {
  const router = useRouter();
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
          g.items.some((i) => i.title.toLowerCase().includes(term)),
      ),
    [items, section, term],
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
      <View accessibilityLabel="Prüfungen werden geladen" style={{ gap: spacing.md }}>
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
        {level ? (
          <TeilTimeCard section={section} level={level} teil={1} showLastResult={false} />
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
            title={term ? 'Nichts gefunden' : 'Noch keine Schreibaufgaben'}
            message={
              term ? 'Passe die Suche an.' : 'Für dieses Niveau gibt es hier noch keine Aufgaben.'
            }
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
              title={i.title}
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
        <EmptyState
          emoji="ℹ️"
          title="Noch keine Informationen"
          message="Hier gibt es noch keine Inhalte."
        />
      );
  } else if (groups.length === 0) {
    body = (
      <EmptyState
        emoji="🔍"
        title={term ? 'Nichts gefunden' : 'Noch keine Übungen'}
        message={
          term ? 'Passe die Suche an.' : 'Für dieses Niveau gibt es hier noch keine Übungen.'
        }
        actionLabel={term ? 'Suche zurücksetzen' : undefined}
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
            emoji={meta.emoji}
            label={g.label}
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
      title="Prüfung üben"
      subtitle="Bereite dich Schritt für Schritt vor."
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
        <View style={[styles.cont, { backgroundColor: tint(SECTION_META[target.section].color, '14') }]}>
          <View style={styles.contTop}>
            <View style={[styles.contIcon, { backgroundColor: tint(SECTION_META[target.section].color, '33') }]}>
              <AppText style={{ fontSize: 28, lineHeight: 36 }}>{SECTION_META[target.section].emoji}</AppText>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="small" color={colors.ink} style={{ fontWeight: '700' }}>
                Weiterlernen · {SECTION_META[target.section].label}
              </AppText>
              <AppText style={styles.contTitle} numberOfLines={2}>
                {target.partLabel}
              </AppText>
            </View>
          </View>
          <ProgressBar
            value={target.avgScore}
            color={SECTION_META[target.section].color}
            label="Fortschritt im Prüfungsteil"
          />
          <Button
            pill
            label={
              target.state === 'completed'
                ? 'Wiederholen'
                : target.state === 'in_progress'
                  ? 'Weiter'
                  : 'Starten'
            }
            onPress={() => openExercise(target.exerciseId)}
          />
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <AppText style={styles.heading} accessibilityRole="header">
          Was möchtest du üben?
        </AppText>
        <ScrollView
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
        </ScrollView>
      </View>

      <View ref={partsRef} collapsable={false} style={{ gap: spacing.md }}>
        <View style={[styles.panel, { backgroundColor: tint(color, '14') }]}>
          <View style={[styles.panelIcon, { backgroundColor: tint(color, '33') }]}>
            <AppText style={{ fontSize: 30, lineHeight: 38 }}>{meta.emoji}</AppText>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.panelTitleRow}>
              <AppText style={styles.panelTitle} accessibilityRole="header">
                {meta.label}
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
                ? meta.description
                : `${stats.mastered} / ${stats.total} Aufgaben · Ø ${stats.avg}% – ${meta.description}`}
            </AppText>
          </View>
        </View>

        {!meta.informational ? (
          <View style={styles.search}>
            <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
            <TextInput
              accessibilityLabel="Suche nach Prüfungsteil oder Aufgabe"
              placeholder="Prüfungsteil oder Aufgabe suchen …"
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {search ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Suche löschen"
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
            <AppText variant="subheading">Für später gemerkt</AppText>
          </View>
          <AppText variant="small" color={colors.mutedForeground}>
            {bookmarksCount} gemerkte {bookmarksCount === 1 ? 'Aufgabe wartet' : 'Aufgaben warten'} noch.
          </AppText>
          <View style={{ marginTop: spacing.sm }}>
            {saved.slice(0, 3).map((b) => (
              <ExerciseRow
                key={b.id}
                color={SECTION_META[b.section]?.color}
                item={{
                  id: b.id,
                  title: `${SECTION_META[b.section]?.label ?? b.section}: ${b.title}`,
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
              +{bookmarksCount - 3} weitere
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {level ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="⏱ Mein Zeitmanagement"
          onPress={() => router.push({ pathname: '/exam-prep/zeitmanagement', params: { level } })}
          style={({ pressed }) => [styles.timeTile, pressed && { backgroundColor: colors.accent }]}
        >
          <View style={styles.timeIcon}>
            <Ionicons name="timer-outline" size={26} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">Mein Zeitmanagement</AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              Deine Zeit pro Teil im Vergleich zur Vorgabe
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </SkyScreen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink },

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
  readyKicker: { fontSize: 13, lineHeight: 18, fontWeight: '800', letterSpacing: 0.8, color: colors.primaryDark },
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
  pillTrack: { width: '70%', height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  pillFill: { height: '100%', borderRadius: 2 },

  cont: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  contTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
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
  bubbleIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
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
  panelIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
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
  partNode: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
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
  partBody: { flex: 1, gap: 4 },
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
