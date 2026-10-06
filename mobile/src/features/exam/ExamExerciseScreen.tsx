import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { AppText, Button, Card, ErrorState, Skeleton } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ExamExercise } from '@/types/exam';
import type { ExamPracticeSessionResult } from '@/types/examTime';
import { RichContentScale } from './components/RichContentScale';
import { ExerciseFrame, IconButton, QuizTopBar, TextSizeControl } from './components/kit';
import { PassageBody } from './components/Passages';
import { QuizRunner } from './components/QuizRunner';
import { SECTION_META } from './examMeta';
import { ExamExerciseTimer } from './time/ExamExerciseTimer';
import { useStopExerciseTimer } from './time/hooks';
import { WritingExercise } from './writing/WritingExercise';
import { useExamExercise, useMarkExamCompleted, useToggleExamBookmark } from './hooks';

/** Testformat pages are read-only information; finishing them is a manual "erledigt". */
function InfoBody({ exercise }: { exercise: ExamExercise }) {
  const mark = useMarkExamCompleted(exercise.id);
  return (
    <ExerciseFrame
      footer={
        <>
          {mark.error ? (
            <AppText color={colors.destructive} accessibilityRole="alert">
              {mark.error.message}
            </AppText>
          ) : null}
          <Button
            pill
            label={exercise.completed ? 'Als erledigt markiert ✓' : 'Als erledigt markieren'}
            variant={exercise.completed ? 'secondary' : 'primary'}
            disabled={exercise.completed}
            loading={mark.isPending}
            onPress={() => mark.mutate()}
          />
        </>
      }
    >
      <View style={styles.sizeRow}>
        <TextSizeControl />
      </View>
      {exercise.teilDescription ? (
        <Card tone="accent">
          <AppText>{exercise.teilDescription}</AppText>
        </Card>
      ) : null}
      <Card style={{ gap: spacing.md }}>
        {exercise.passages.map((p) => (
          <PassageBody key={p.id} passage={p} />
        ))}
      </Card>
    </ExerciseFrame>
  );
}

/** Schreiben: the task text, then the write → feedback → revise flow. */
function WritingBody({ exercise }: { exercise: ExamExercise }) {
  const mark = useMarkExamCompleted(exercise.id);
  const stopTimer = useStopExerciseTimer(exercise.id);
  const [timeResult, setTimeResult] = useState<ExamPracticeSessionResult | null>(null);
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ExerciseFrame>
        <View style={styles.sizeRow}>
          <TextSizeControl />
        </View>
        {exercise.teilDescription ? (
          <Card tone="accent">
            <AppText>{exercise.teilDescription}</AppText>
          </Card>
        ) : null}
        <Card style={{ gap: spacing.md }}>
          {exercise.passages.map((p) => (
            <PassageBody key={p.id} passage={p} />
          ))}
        </Card>
        <WritingExercise
          exercise={exercise}
          timeResult={timeResult}
          onSubmitted={() => {
            if (!exercise.completed && !mark.isPending) mark.mutate();
            void stopTimer().then(setTimeResult);
          }}
        />
      </ExerciseFrame>
    </KeyboardAvoidingView>
  );
}

/**
 * Focus mode: a slim top bar (close, title, bookmark), the timer strip, and a body that owns the
 * rest of the screen: intro → questions → results, each with its action pinned at the bottom.
 */
export function ExamExerciseScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const query = useExamExercise(exerciseId);
  const bookmark = useToggleExamBookmark();
  const close = () => router.back();
  // Quizzes time themselves from "Übung starten"; writing has no start button and runs from opening.
  const [started, setStarted] = useState(false);

  if (query.isPending) {
    return (
      <View style={styles.root}>
        <QuizTopBar title="Übung" color={colors.primary} onClose={close} />
        <View accessibilityLabel="Übung wird geladen" style={styles.loading}>
          <Skeleton height={96} />
          <Skeleton width="70%" height={28} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </View>
      </View>
    );
  }
  if (query.isError || !query.data) {
    return (
      <View style={styles.root}>
        <QuizTopBar title="Übung" color={colors.primary} onClose={close} />
        <View style={styles.loading}>
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </View>
      </View>
    );
  }

  const exercise = query.data;
  const meta = SECTION_META[exercise.section];
  const info = exercise.section === 'TESTFORMAT_INFORMATION';
  const writing = exercise.section === 'SCHRIFTLICHER_AUSDRUCK';

  return (
    <RichContentScale>
    <View style={styles.root}>
      <QuizTopBar
        title={exercise.title}
        subtitle={`${meta?.label ?? ''}${exercise.level ? ` · ${exercise.level}` : ''}`}
        color={meta?.color ?? colors.primary}
        onClose={close}
        right={
          <IconButton
            name={exercise.bookmarked ? 'star' : 'star-outline'}
            label={exercise.bookmarked ? 'Merkzeichen entfernen' : 'Aufgabe merken'}
            color={exercise.bookmarked ? colors.warning : colors.mutedForeground}
            selected={exercise.bookmarked}
            busy={bookmark.isPending}
            onPress={() => bookmark.mutate({ id: exercise.id, bookmarked: exercise.bookmarked })}
          />
        }
      />
      <ExamExerciseTimer exercise={exercise} armed={writing || started} fresh={!writing} />
      <View style={{ flex: 1 }}>
        {info ? <InfoBody exercise={exercise} /> : writing ? <WritingBody exercise={exercise} /> : <QuizRunner exercise={exercise} onStarted={() => setStarted(true)} onReset={() => setStarted(false)} />}
      </View>
    </View>
    </RichContentScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loading: { padding: spacing.lg, gap: spacing.md },
  sizeRow: { alignItems: 'flex-end' },
});
