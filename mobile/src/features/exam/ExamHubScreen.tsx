import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Header,
  ListItem,
  ProgressBar,
  Screen,
  Skeleton,
  TextField,
} from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { MIN_TOUCH, colors, spacing } from '@/theme';
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
    () => (level && exercises.data ? exercisesForSectionAndLevel(exercises.data, section, level) : []),
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
    ? (groupIntoParts(items, section)[0]?.items ?? []).filter((i) => term === '' || i.title.toLowerCase().includes(term))
    : [];
  const lastTimes = useExerciseLastTimes(isFlat ? section : null, level);
  const infoItems = meta.informational
    ? items.filter((i) => term === '' || i.title.toLowerCase().includes(term))
    : [];
  const target = level && exercises.data && !meta.informational ? findContinueTarget(exercises.data, level, section) : null;

  const openExercise = (id: string) =>
    router.push({ pathname: '/exam-prep/exercise/[exerciseId]', params: { exerciseId: id } });
  const openPart = (key: string, firstId: string, only: boolean) => {
    if (only) openExercise(firstId);
    else router.push({ pathname: '/exam-prep/teil', params: { section, level: level!, part: key } });
  };

  const sectionStats = (s: ExamSection) => {
    const list = level && exercises.data ? exercisesForSectionAndLevel(exercises.data, s, level) : [];
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
        {level ? <TeilTimeCard section={section} level={level} teil={1} showLastResult={false} /> : null}
        {flatItems.length > 0 ? (
          <View>
            {flatItems.map((item) => (
              <ExerciseRow
                key={item.id}
                item={item}
                onPress={() => openExercise(item.id)}
                onToggleBookmark={() => bookmark.mutate({ id: item.id, bookmarked: item.bookmarked })}
                bookmarkBusy={bookmark.isPending && bookmark.variables?.id === item.id}
                lastTime={lastTimes[item.id]}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            emoji="✍️"
            title={term ? 'Nichts gefunden' : 'Noch keine Schreibaufgaben'}
            message={term ? 'Passe die Suche an.' : 'Für dieses Niveau gibt es hier noch keine Aufgaben.'}
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
              trailing={<AppText color={i.completed ? colors.success : colors.mutedForeground}>{i.completed ? '✓' : '›'}</AppText>}
              onPress={() => openExercise(i.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyState emoji="ℹ️" title="Noch keine Informationen" message="Hier gibt es noch keine Inhalte." />
      );
  } else if (groups.length === 0) {
    body = (
      <EmptyState
        emoji="🔍"
        title={term ? 'Nichts gefunden' : 'Noch keine Übungen'}
        message={term ? 'Passe die Suche an.' : 'Für dieses Niveau gibt es hier noch keine Übungen.'}
        actionLabel={term ? 'Suche zurücksetzen' : undefined}
        onAction={term ? () => setSearch('') : undefined}
      />
    );
  } else {
    body = (
      <View style={{ gap: spacing.md }}>
        {groups.map((g, i) => (
          <Pressable
            key={g.key}
            accessibilityRole="button"
            accessibilityLabel={`${g.label}, ${g.mastered} von ${g.total} Aufgaben gemeistert`}
            onPress={() => openPart(g.key, g.items[0].id, g.items.length === 1)}
          >
            <Card style={{ gap: spacing.sm }}>
              <View style={styles.between}>
                <AppText variant="subheading" style={{ flex: 1 }}>
                  {i + 1}. {g.label}
                </AppText>
                <AppText color={g.state === 'completed' ? colors.success : colors.mutedForeground}>
                  {g.state === 'completed' ? '✓' : '›'}
                </AppText>
              </View>
              <ProgressBar value={g.avgScore} label={`${g.label} Fortschritt`} />
              <AppText variant="small" color={colors.mutedForeground}>
                {g.mastered} / {g.total} {g.total === 1 ? 'Übung' : 'Übungen'} · Ø {g.avgScore}%
              </AppText>
            </Card>
          </Pressable>
        ))}
      </View>
    );
  }

  const saved = pending.data ?? [];

  return (
    <Screen bottomInset={false}>
      <Header title="Prüfungsvorbereitung" subtitle="Bereite dich Schritt für Schritt auf die Prüfung vor." />

      {saved.length > 0 ? (
        <Card style={{ gap: spacing.xs }}>
          <AppText variant="subheading">Für später gemerkt</AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {saved.length} gemerkte {saved.length === 1 ? 'Aufgabe wartet' : 'Aufgaben warten'} noch.
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {SECTION_ORDER.map((s) => (
          <Chip key={s} label={`${SECTION_META[s].emoji} ${SECTION_META[s].label}`} selected={s === section} onPress={() => setSection(s)} />
        ))}
      </ScrollView>

      {summaries.length > 0 ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="small" color={colors.mutedForeground}>
            Prüfungsniveau
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {summaries.map((s) => (
              <Chip
                key={s.level}
                label={`${s.level} · ${s.mastered}/${s.total}`}
                selected={s.level === level}
                onPress={() => setPickedLevel(s.level)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <TextField label="Suche nach Prüfungsteil oder Aufgabe" value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false} returnKeyType="search" />

      {target ? (
        <Card tone="accent" style={{ gap: spacing.sm }}>
          <AppText variant="small" color={colors.primaryDark}>
            Weiterlernen · {SECTION_META[target.section].label}
          </AppText>
          <AppText variant="subheading">{target.partLabel}</AppText>
          <ProgressBar value={target.avgScore} label="Fortschritt im Prüfungsteil" />
          <Button
            label={target.state === 'completed' ? 'Wiederholen' : target.state === 'in_progress' ? 'Weiter' : 'Starten'}
            onPress={() => openExercise(target.exerciseId)}
          />
        </Card>
      ) : null}

      {!meta.informational && stats.total > 0 ? (
        <View style={{ gap: spacing.xs }}>
          <View style={styles.between}>
            <AppText variant="subheading">{meta.label}</AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              {stats.mastered} / {stats.total} Aufgaben · {stats.avg}%
            </AppText>
          </View>
          <AppText variant="small" color={colors.mutedForeground}>
            {meta.description}
          </AppText>
        </View>
      ) : null}

      {body}

      {level ? (
        <Button
          label="⏱ Mein Zeitmanagement"
          variant="secondary"
          onPress={() => router.push({ pathname: '/exam-prep/zeitmanagement', params: { level } })}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: spacing.sm, paddingVertical: spacing.xs, minHeight: MIN_TOUCH - 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});
