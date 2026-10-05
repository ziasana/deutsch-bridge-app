import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, ErrorState, Header, Screen, Skeleton } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ExamExercise } from '@/types/exam';
import { AnswerPool, PassageBody, PassagesView } from './components/Passages';
import { QuizRunner } from './components/QuizRunner';
import { SECTION_META } from './examMeta';
import { useExamExercise, useMarkExamCompleted, useToggleExamBookmark } from './hooks';

/** Testformat pages are read-only information; finishing them is a manual "erledigt". */
function InfoBody({ exercise }: { exercise: ExamExercise }) {
  const mark = useMarkExamCompleted(exercise.id);
  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={{ gap: spacing.md }}>
        {exercise.passages.map((p) => (
          <PassageBody key={p.id} passage={p} />
        ))}
      </Card>
      {mark.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {mark.error.message}
        </AppText>
      ) : null}
      <Button
        label={exercise.completed ? 'Als erledigt markiert ✓' : 'Als erledigt markieren'}
        variant={exercise.completed ? 'secondary' : 'primary'}
        disabled={exercise.completed}
        loading={mark.isPending}
        onPress={() => mark.mutate()}
      />
    </View>
  );
}

/** The writing flow (planner, editor, AI feedback) comes later; show the task so nothing is hidden. */
function WritingBody({ exercise }: { exercise: ExamExercise }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={{ gap: spacing.md }}>
        {exercise.passages.map((p) => (
          <PassageBody key={p.id} passage={p} />
        ))}
      </Card>
      <Card tone="accent">
        <AppText variant="subheading">✍️ Schreiben folgt</AppText>
        <AppText>
          Das Schreiben mit Planer und KI-Feedback ist in der App noch nicht verfügbar. Du kannst
          diese Aufgabe in der Web-App bearbeiten.
        </AppText>
      </Card>
    </View>
  );
}

export function ExamExerciseScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const query = useExamExercise(exerciseId);
  const bookmark = useToggleExamBookmark();

  if (query.isPending) {
    return (
      <Screen>
        <Header title="Übung" back />
        <View accessibilityLabel="Übung wird geladen" style={{ gap: spacing.md }}>
          <Skeleton width="70%" height={28} />
          <Skeleton height={120} />
          <Skeleton height={56} />
        </View>
      </Screen>
    );
  }
  if (query.isError || !query.data) {
    return (
      <Screen>
        <Header title="Übung" back />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const exercise = query.data;
  const meta = SECTION_META[exercise.section];
  const info = exercise.section === 'TESTFORMAT_INFORMATION';
  const writing = exercise.section === 'SCHRIFTLICHER_AUSDRUCK';
  const listening = exercise.section === 'HOERVERSTEHEN';
  // Listening clips (with their players) appear once the attempt starts, so they aren't shown here.
  const showPassages = !info && !writing && !listening;

  return (
    <Screen>
      <Header title={exercise.title} subtitle={meta?.label} back />
      <View style={styles.meta}>
        <Badge tone="primary" label={exercise.level ?? 'Alle Niveaus'} />
        {exercise.completed ? <Badge tone="success" label="✓ Erledigt" /> : null}
        {exercise.lastScore != null ? <Badge label={`Letztes Ergebnis ${Math.round(exercise.lastScore)}%`} /> : null}
      </View>
      <Button
        label={exercise.bookmarked ? '★ Gemerkt' : '☆ Merken'}
        variant="secondary"
        loading={bookmark.isPending}
        onPress={() => bookmark.mutate({ id: exercise.id, bookmarked: exercise.bookmarked })}
      />

      {exercise.teilDescription ? (
        <Card tone="accent">
          <AppText>{exercise.teilDescription}</AppText>
        </Card>
      ) : null}

      {showPassages ? (
        <>
          {exercise.taskType === 'MATCHING' || exercise.taskType === 'WORD_BANK_CLOZE' ? (
            <AnswerPool
              answerOptions={exercise.answerOptions ?? []}
              labels={exercise.answerOptionLabels}
              taskType={exercise.taskType}
            />
          ) : null}
          <PassagesView passages={exercise.passages} taskType={exercise.taskType} />
        </>
      ) : null}

      {info ? <InfoBody exercise={exercise} /> : writing ? <WritingBody exercise={exercise} /> : <QuizRunner exercise={exercise} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
