import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

const SECTION_COLORS: Record<ExamSection, string> = {
  LESEVERSTEHEN: '#3F86F0',
  SPRACHBAUSTEINE: '#7B61D9',
  HOERVERSTEHEN: '#E8832E',
  SCHRIFTLICHER_AUSDRUCK: '#2E8B57',
  TESTFORMAT_INFORMATION: '#64748B',
};

/** Equal-width level switcher: every level is visible at once, no sideways scrolling. */
function LevelSwitch({
  summaries,
  level,
  onPick,
}: {
  summaries: { level: string; mastered: number; total: number }[];
  level: string | null;
  onPick: (level: string) => void;
}) {
  return (
    <View style={styles.switchTrack} accessibilityRole="tablist">
      {summaries.map((s) => {
        const on = s.level === level;
        return (
          <Pressable
            key={s.level}
            accessibilityRole="button"
            accessibilityLabel={`${s.level} · ${s.mastered}/${s.total}`}
            accessibilityState={{ selected: on }}
            onPress={() => onPick(s.level)}
            style={[styles.switchItem, on && styles.switchItemOn]}
          >
            <AppText style={[styles.switchLevel, on && { color: colors.primaryDark }]}>
              {s.level}
            </AppText>
            <AppText variant="caption" color={on ? colors.primaryDark : colors.mutedForeground}>
              {s.mastered}/{s.total}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Big tappable exam-section card: icon, name, progress ring and task count. */
function SectionCard({
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
  const color = SECTION_COLORS[section];
  const [scale] = useState(() => new Animated.Value(1));
  const spring = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      friction: 7,
      tension: 220,
      useNativeDriver: true,
    }).start();
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const wide = !!meta.informational;
  return (
    <Animated.View style={[wide ? styles.cardWide : styles.cardHalf, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          meta.informational
            ? `${meta.emoji} ${meta.label}`
            : `${meta.emoji} ${meta.label}, ${mastered} von ${total} Aufgaben gemeistert`
        }
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={() => spring(0.96)}
        onPressOut={() => spring(1)}
        style={[
          styles.sectionCard,
          wide && styles.sectionCardWide,
          {
            borderColor: selected ? color : colors.border,
            backgroundColor: selected ? `${color}14` : '#FFFFFF',
          },
        ]}
      >
        {wide ? (
          <>
            <View
              style={[styles.sectionIcon, { backgroundColor: selected ? color : `${color}22` }]}
            >
              <AppText style={styles.sectionEmoji}>{meta.emoji}</AppText>
            </View>
            <View style={styles.sectionText}>
              <AppText style={styles.sectionName}>{meta.label}</AppText>
              <AppText variant="caption" color={colors.mutedForeground}>
                So läuft die Prüfung ab
              </AppText>
            </View>
            <Ionicons name="information-circle-outline" size={28} color={color} />
          </>
        ) : (
          <>
            <View style={styles.sectionTop}>
              <View
                style={[styles.sectionIcon, { backgroundColor: selected ? color : `${color}22` }]}
              >
                <AppText style={styles.sectionEmoji}>{meta.emoji}</AppText>
              </View>
              <ProgressRing
                value={pct}
                size={48}
                stroke={5}
                color={color}
                textSize={11}
                label={`${meta.label} Fortschritt`}
              />
            </View>
            <View style={styles.sectionText}>
              <AppText
                style={styles.sectionName}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {meta.label}
              </AppText>
              <AppText variant="caption" color={colors.mutedForeground} numberOfLines={1}>
                {mastered} von {total} Aufgaben
              </AppText>
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** One exam part: outlined card with icon, title, progress line and a chevron / check. */
function PartCard({
  index,
  label,
  emoji,
  done,
  mastered,
  total,
  avg,
  onPress,
}: {
  index: number;
  label: string;
  emoji: string;
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
      style={({ pressed }) => [styles.part, pressed && { backgroundColor: colors.accent }]}
    >
      <View style={styles.partIcon}>
        <AppText style={styles.partEmoji}>{emoji}</AppText>
      </View>
      <View style={styles.partBody}>
        <AppText style={styles.partTitle}>
          {index}. {label}
        </AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {mastered} / {total} {total === 1 ? 'Übung' : 'Übungen'} · Ø {avg}%
        </AppText>
        <ProgressBar value={avg} label={`${label} Fortschritt`} />
      </View>
      {done ? (
        <Ionicons name="checkmark-circle" size={26} color={colors.success} />
      ) : (
        <Ionicons name="chevron-forward" size={24} color={colors.mutedForeground} />
      )}
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
        {groups.map((g, i) => (
          <PartCard
            key={g.key}
            index={i + 1}
            label={g.label}
            emoji={meta.emoji}
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

  return (
    <SkyScreen
      scrollRef={scrollRef}
      title="Prüfung üben"
      subtitle="Bereite dich Schritt für Schritt vor."
      search={{
        value: search,
        onChange: setSearch,
        placeholder: 'Prüfungsteil oder Aufgabe suchen …',
        label: 'Suche nach Prüfungsteil oder Aufgabe',
      }}
    >
      {target ? (
        <Card tone="accent" style={{ gap: spacing.sm }}>
          <AppText variant="small" color={colors.primaryDark}>
            Weiterlernen · {SECTION_META[target.section].label}
          </AppText>
          <AppText variant="subheading">{target.partLabel}</AppText>
          <ProgressBar value={target.avgScore} label="Fortschritt im Prüfungsteil" />
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
        </Card>
      ) : null}

      {summaries.length > 1 ? (
        <View style={{ gap: spacing.sm }}>
          <AppText style={styles.heading} accessibilityRole="header">
            Niveau
          </AppText>
          <LevelSwitch summaries={summaries} level={level} onPick={setPickedLevel} />
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <AppText style={styles.heading} accessibilityRole="header">
          Was möchtest du üben?
        </AppText>
        {summaries.length === 1 && level ? (
          <AppText variant="small" color={colors.mutedForeground}>
            Prüfungsniveau {level} · {summaries[0].mastered}/{summaries[0].total} gemeistert
          </AppText>
        ) : null}
        <View style={styles.cardGrid}>
          {SECTION_ORDER.map((sec) => {
            const st = sectionStats(sec);
            return (
              <SectionCard
                key={sec}
                section={sec}
                mastered={st.mastered}
                total={st.total}
                selected={sec === section}
                onPress={() => selectSection(sec)}
              />
            );
          })}
        </View>
      </View>

      {saved.length > 0 ? (
        <Card style={{ gap: spacing.xs }}>
          <AppText variant="subheading">Für später gemerkt</AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {saved.length} gemerkte {saved.length === 1 ? 'Aufgabe wartet' : 'Aufgaben warten'}{' '}
            noch.
          </AppText>
          {saved.slice(0, 3).map((b) => (
            <ExerciseRow
              key={b.id}
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
          {saved.length > 3 ? (
            <AppText variant="small" color={colors.mutedForeground}>
              +{saved.length - 3} weitere
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <View ref={partsRef} collapsable={false} style={{ gap: 2 }}>
        <AppText style={styles.heading} accessibilityRole="header">
          {meta.emoji} {meta.label}
        </AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {meta.informational || stats.total === 0
            ? meta.description
            : `${stats.mastered} / ${stats.total} Aufgaben · Ø ${stats.avg}% – ${meta.description}`}
        </AppText>
      </View>

      {body}

      {level ? (
        <Button
          pill
          label="⏱ Mein Zeitmanagement"
          variant="secondary"
          onPress={() => router.push({ pathname: '/exam-prep/zeitmanagement', params: { level } })}
        />
      ) : null}
    </SkyScreen>
  );
}

const styles = StyleSheet.create({
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink },
  switchTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  switchItem: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  switchItemOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1D2433',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  switchLevel: { fontSize: 16, lineHeight: 20, fontWeight: '800', color: colors.ink },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cardHalf: { width: '48%', flexGrow: 1 },
  cardWide: { width: '100%' },
  sectionCard: {
    minHeight: 132,
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  sectionCardWide: {
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sectionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEmoji: { fontSize: 22, lineHeight: 28 },
  sectionText: { flex: 1, gap: 2 },
  sectionName: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.ink },
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
  partIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partEmoji: { fontSize: 28, lineHeight: 36 },
  partBody: { flex: 1, gap: 4 },
  partTitle: { fontSize: 19, lineHeight: 25, fontWeight: '600', color: colors.ink },
});
