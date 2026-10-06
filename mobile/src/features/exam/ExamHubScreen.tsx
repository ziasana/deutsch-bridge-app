import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListItem,
  ProgressBar,
  SkyScreen,
  Skeleton,
} from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
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

const LEVEL_COLORS: Record<string, string> = {
  A1: '#34B27B',
  A2: '#2BA5A5',
  B1: '#3F86F0',
  B2: '#7B61D9',
  C1: '#F08A3C',
  C2: '#E5654F',
};

/** "#Lesen"-style pill; filled blue when selected. */
function SectionPill({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${emoji} ${label}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.pill, selected && styles.pillOn]}
    >
      <AppText
        variant="small"
        color={selected ? '#FFFFFF' : colors.primaryDark}
        style={styles.pillText}
      >
        #{label}
      </AppText>
    </Pressable>
  );
}

/** Level card: colourful square with the level, and the learner's progress underneath. */
function LevelTile({
  level,
  mastered,
  total,
  selected,
  onPress,
}: {
  level: string;
  mastered: number;
  total: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${level} · ${mastered}/${total}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.tileWrap}
    >
      <View
        style={[
          styles.tile,
          { backgroundColor: LEVEL_COLORS[level] ?? colors.primary },
          selected && styles.tileOn,
        ]}
      >
        <View style={styles.tileDeco} />
        <AppText style={styles.tileLevel} color="#FFFFFF">
          {level}
        </AppText>
        {selected ? (
          <View style={styles.tileCheck}>
            <Ionicons name="checkmark" size={16} color={colors.ink} />
          </View>
        ) : null}
      </View>
      <AppText variant="small" style={styles.tileLabel}>
        {mastered}/{total}
      </AppText>
    </Pressable>
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
      title="Prüfung üben"
      subtitle="Bereite dich Schritt für Schritt vor."
      search={{
        value: search,
        onChange: setSearch,
        placeholder: 'Prüfungsteil oder Aufgabe suchen …',
        label: 'Suche nach Prüfungsteil oder Aufgabe',
      }}
    >
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

      <View style={styles.categoryRow}>
        <AppText style={styles.categoryLabel}>Bereich:</AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {SECTION_ORDER.map((s) => (
            <SectionPill
              key={s}
              emoji={SECTION_META[s].emoji}
              label={SECTION_META[s].label}
              selected={s === section}
              onPress={() => setSection(s)}
            />
          ))}
        </ScrollView>
      </View>

      {summaries.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tiles}
          style={styles.bleed}
        >
          {summaries.map((s) => (
            <LevelTile
              key={s.level}
              level={s.level}
              mastered={s.mastered}
              total={s.total}
              selected={s.level === level}
              onPress={() => setPickedLevel(s.level)}
            />
          ))}
        </ScrollView>
      ) : null}

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

      {!meta.informational && stats.total > 0 ? (
        <View style={{ gap: 2 }}>
          <AppText style={styles.heading} accessibilityRole="header">
            {meta.label}
          </AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {stats.mastered} / {stats.total} Aufgaben · {stats.avg}% – {meta.description}
          </AppText>
        </View>
      ) : null}

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
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  categoryLabel: { fontSize: 16, fontWeight: '700', color: colors.ink },
  pills: { gap: spacing.sm, paddingRight: spacing.xl },
  pill: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: '#3F86F0' },
  pillText: { fontWeight: '600' },
  bleed: { marginHorizontal: -spacing.xl },
  tiles: { gap: spacing.lg, paddingHorizontal: spacing.xl },
  tileWrap: { alignItems: 'center', gap: spacing.sm },
  tile: {
    width: 104,
    height: 104,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileOn: { borderWidth: 3, borderColor: colors.ink },
  tileDeco: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: -40,
    right: -40,
  },
  tileLevel: { fontSize: 38, lineHeight: 46, fontWeight: '800' },
  tileCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontWeight: '600', color: colors.ink },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink },
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
