import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Header,
  ProgressBar,
  Screen,
  Skeleton,
} from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ExamSection } from '@/types/exam';
import { ExerciseRow } from './components/ExerciseRow';
import { effectiveScore, findGroupByKey } from './examData';
import { SECTION_META, SECTION_ORDER } from './examMeta';
import { useExamExercises, useToggleExamBookmark } from './hooks';

type Filter = 'ALL' | 'OPEN' | 'DONE';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Alle' },
  { value: 'OPEN', label: 'Offen' },
  { value: 'DONE', label: 'Abgeschlossen' },
];

export function ExamTeilScreen() {
  const router = useRouter();
  const { section, level, part } = useLocalSearchParams<{ section: string; level: string; part: string }>();
  const valid = SECTION_ORDER.includes(section as ExamSection);
  const query = useExamExercises(valid ? level : null);
  const bookmark = useToggleExamBookmark();
  const [filter, setFilter] = useState<Filter>('ALL');

  const open = (id: string) =>
    router.push({ pathname: '/exam-prep/exercise/[exerciseId]', params: { exerciseId: id } });

  if (!valid) {
    return (
      <Screen>
        <Header title="Prüfungsteil" back />
        <EmptyState emoji="🔍" title="Nicht gefunden" message="Dieser Prüfungsteil konnte nicht gefunden werden." actionLabel="Zurück" onAction={() => router.back()} />
      </Screen>
    );
  }
  if (query.isPending) {
    return (
      <Screen>
        <Header title="Prüfungsteil" back />
        <View accessibilityLabel="Übungen werden geladen" style={{ gap: spacing.md }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={56} />
          ))}
        </View>
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen>
        <Header title="Prüfungsteil" back />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const typed = section as ExamSection;
  const group = findGroupByKey(query.data, typed, level, part);
  if (!group) {
    return (
      <Screen>
        <Header title="Prüfungsteil" back />
        <EmptyState emoji="🔍" title="Nicht gefunden" message="Dieser Prüfungsteil konnte nicht gefunden werden." actionLabel="Zurück" onAction={() => router.back()} />
      </Screen>
    );
  }

  const questions = group.items.reduce((sum, i) => sum + i.questionsCount, 0);
  const next = group.items.find((i) => effectiveScore(i) < 100) ?? group.items[0];
  const started = group.items.some((i) => i.completed);
  const continueLabel =
    group.state === 'completed'
      ? `Wiederholen: ${next.title}`
      : started
        ? `Weiter: ${next.title}`
        : `Starten: ${next.title}`;
  const items = group.items.filter(
    (i) => filter === 'ALL' || (filter === 'DONE' ? effectiveScore(i) === 100 : effectiveScore(i) < 100),
  );

  return (
    <Screen>
      <Header
        title={group.heading}
        subtitle={`${group.subheading ? `${group.subheading} · ` : ''}${SECTION_META[typed].label}`}
        back
      />
      <AppText color={colors.mutedForeground}>
        {group.total} {group.total === 1 ? 'Übung' : 'Übungen'} · {questions} {questions === 1 ? 'Frage' : 'Fragen'}
      </AppText>

      <Card style={{ gap: spacing.md }}>
        <View style={styles.between}>
          <AppText variant="subheading">Dein Fortschritt</AppText>
          <AppText color={colors.mutedForeground}>
            {group.mastered} / {group.total}
          </AppText>
        </View>
        <ProgressBar value={group.avgScore} label="Dein Fortschritt" />
        <Button label={continueLabel} onPress={() => open(next.id)} />
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => (
          <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </ScrollView>

      <View>
        {items.map((item) => (
          <ExerciseRow
            key={item.id}
            item={item}
            onPress={() => open(item.id)}
            onToggleBookmark={() => bookmark.mutate({ id: item.id, bookmarked: item.bookmarked })}
            bookmarkBusy={bookmark.isPending && bookmark.variables?.id === item.id}
          />
        ))}
        {items.length === 0 ? (
          <AppText center color={colors.mutedForeground} style={{ paddingVertical: spacing.xl }}>
            Keine Übungen für diesen Filter gefunden.
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
});
