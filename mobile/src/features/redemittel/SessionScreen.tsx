import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, EmptyState, ErrorState, ProgressBar, Skeleton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { RedemittelAnswer } from '@/types/redemittel';
import { Exercise } from './components/Exercise';
import { PhraseIllustration, RedemittelHero } from './components/RedemittelViz';
import { useAnswer, useRedemittelSession } from './hooks';
import { REDEMITTEL_COLOR } from './meta';

/** Runs a review or practice session: one exercise at a time, a progress bar and a closing summary. */
export function SessionScreen({ mode }: { mode: 'review' | 'practice' }) {
  const router = useRouter();
  const { ids: idsParam } = useLocalSearchParams<{ ids?: string }>();
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : undefined;
  const session = useRedemittelSession(mode, ids);
  const answer = useAnswer(mode);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  const title = mode === 'review' ? 'Wiederholung' : 'Üben';
  const exercises = session.data?.exercises ?? [];
  const finished = exercises.length > 0 && index >= exercises.length;
  const correct = results.filter(Boolean).length;
  const home = () => router.navigate('/learn/redemittel');

  const handleAnswer = async (value: string): Promise<RedemittelAnswer> => {
    const e = exercises[index];
    const res = await answer.mutateAsync({
      phraseId: e.phraseId,
      exerciseId: e.exerciseId,
      answer: value,
    });
    setResults((prev) => [...prev, res.correct]);
    return res;
  };

  let body;
  if (session.isPending) {
    body = (
      <View accessibilityLabel="Übungen werden geladen" style={{ gap: spacing.md }}>
        <Skeleton height={8} />
        <Skeleton height={220} />
      </View>
    );
  } else if (session.isError) {
    body = <ErrorState error={session.error} onRetry={() => void session.refetch()} />;
  } else if (exercises.length === 0) {
    body =
      mode === 'review' ? (
        <EmptyState
          emoji="✓"
          title="Keine Wiederholungen"
          message="Du hast momentan keine Redemittel zur Wiederholung."
          actionLabel="Zur Übersicht"
          onAction={home}
        />
      ) : (
        <EmptyState
          emoji="🗣️"
          title="Noch nichts zu üben"
          message="Lerne Redemittel oder speichere welche in „Meine Redemittel“. Üben kannst du die Redemittel, für die es Übungen gibt."
          actionLabel="Lernen starten"
          onAction={() => router.replace('/redemittel/learn')}
        />
      );
  } else if (finished) {
    body = (
      <View style={styles.done}>
        <AppText style={{ fontSize: 48, lineHeight: 56 }}>🎉</AppText>
        <AppText style={styles.doneTitle}>Gut gemacht!</AppText>
        <AppText center color={colors.ink}>
          {correct} von {exercises.length} Antworten waren richtig.
        </AppText>
        {mode === 'review' ? (
          <AppText variant="small" center color={colors.mutedForeground}>
            Deine nächsten Wiederholungen sind automatisch geplant.
          </AppText>
        ) : null}
        <View style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
          <Button pill label="Zur Übersicht" onPress={home} />
        </View>
      </View>
    );
  } else {
    body = (
      <>
        <View style={{ gap: spacing.xs }}>
          <View style={styles.between}>
            <AppText variant="small" color={colors.mutedForeground}>
              Fortschritt
            </AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              {results.length} / {exercises.length}
            </AppText>
          </View>
          <ProgressBar
            value={(results.length / exercises.length) * 100}
            label={`${results.length} von ${exercises.length} erledigt`}
            color={REDEMITTEL_COLOR}
          />
        </View>
        <Exercise
          key={`${index}-${exercises[index].phraseId}`}
          exercise={exercises[index]}
          onAnswer={handleAnswer}
          onNext={() => setIndex((i) => i + 1)}
          isLast={index === exercises.length - 1}
          showSchedule={mode === 'review'}
        />
      </>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <RedemittelHero
          chip={mode === 'review' ? '🔄 WIEDERHOLUNG' : '💪 ÜBEN'}
          title={title}
          subtitle={
            mode === 'review' && session.data
              ? `${session.data.total} Redemittel warten auf dich${
                  session.data.total > exercises.length ? ` – heute ${exercises.length}` : ''
                }.`
              : 'Ein Schritt nach dem anderen, in deinem Tempo.'
          }
          right={<PhraseIllustration size={92} />}
        />
        <View style={styles.body}>{body}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.lg },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  done: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  doneTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.ink },
});
