import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { ExamExercise, ExamQuestionPublic, StartExamAttemptResponse } from '@/types/exam';
import { NO_AD_ANSWER } from '../content';
import { HOEREN_HOWTO, SECTION_META } from '../examMeta';
import { BODY_LINE, BODY_SIZE, scaledText, useExamTextScale } from '../textScale';
import { useCompleteExamAttempt, useSubmitExamAnswer } from '../hooks';
import { ChoiceField, type Choice } from './ChoiceField';
import {
  ExerciseFrame,
  PressableScale,
  SegmentedProgress,
  TextSizeControl,
  tint,
  type SegmentState,
} from './kit';
import { PassageBody, ReadingCard, WordBank } from './Passages';
import type { ResultItem, ResultsState } from './Results';
import { optionsFor } from './StepQuiz';
import { darken } from '@/features/exam/components/kit';

export type BatchVariant = 'grid' | 'hoeren';

type Props = {
  variant: BatchVariant;
  exercise: ExamExercise;
  attempt: StartExamAttemptResponse;
  onFinish: (results: ResultsState) => void;
};

/** "+" / "-" / "R" / "F" read as words on the answer buttons. */
const SIGN_WORD: Record<string, string> = {
  '+': 'Richtig',
  '-': 'Falsch',
  '−': 'Falsch',
  R: 'Richtig',
  F: 'Falsch',
};

function Hint({ icon, children, color }: { icon: keyof typeof Ionicons.glyphMap; children: string; color: string }) {
  return (
    <View style={[styles.hint, { backgroundColor: tint(color, '14') }]}>
      <Ionicons name={icon} size={20} color={color} />
      <AppText variant="small" style={{ flex: 1 }}>
        {children}
      </AppText>
    </View>
  );
}

function NumberBadge({ n, done, color }: { n: number; done: boolean; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: done ? color : tint(color, '1F') }]}>
      {done ? (
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      ) : (
        <AppText variant="small" style={{ fontWeight: '800' }} color={color}>
          {n}
        </AppText>
      )}
    </View>
  );
}

/**
 * Questions answered all at once, then submitted together: word-bank cloze and situation matching
 * ("grid") and Hörverstehen ("hoeren"). Nothing is revealed until everything is handed in, like the
 * real exam. A pinned counter shows how much is left.
 */
export function BatchQuiz({ variant, exercise, attempt, onFinish }: Props) {
  const submit = useSubmitExamAnswer(attempt.attemptId);
  const complete = useCompleteExamAttempt(attempt.attemptId, exercise.id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSituation = exercise.taskType === 'SITUATION_MATCHING';
  const isCloze = exercise.taskType === 'WORD_BANK_CLOZE';
  const color = SECTION_META[exercise.section].color;
  const scale = useExamTextScale();

  const set = (id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value }));
  const total = attempt.questions.length;
  const answered = attempt.questions.filter((q) => answers[q.id]).length;
  const allAnswered = answered === total;
  const firstOpen = attempt.questions.findIndex((q) => !answers[q.id]);
  const states: SegmentState[] = attempt.questions.map((q) => (answers[q.id] ? 'answered' : undefined));

  const submitAll = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const items: ResultItem[] = [];
      for (const question of attempt.questions) {
        const feedback = await submit.mutateAsync({ questionId: question.id, answer: answers[question.id] ?? '' });
        items.push({ question, feedback });
      }
      const result = await complete.mutateAsync();
      onFinish({ score: result.score, items, transcripts: result.transcripts ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Übung konnte nicht abgeschlossen werden.');
      setBusy(false);
    }
  };

  const footer = (
    <>
      {error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Button
        pill
        label={error ? 'Erneut abgeben' : 'Antworten abgeben'}
        loading={busy}
        disabled={!allAnswered}
        onPress={() => void submitAll()}
        color={color}
      />
    </>
  );

  const header = (
    <>
      <SegmentedProgress
        total={total}
        current={firstOpen === -1 ? total - 1 : firstOpen}
        states={states}
        color={color}
        label="Beantwortete Aufgaben"
      />
      <View style={styles.headRow}>
        <AppText variant="small" style={{ fontWeight: '700', flex: 1 }} color={colors.ink}>
          {allAnswered ? '✓ Alles beantwortet – bereit zum Abgeben' : `${answered} von ${total} beantwortet`}
        </AppText>
        <TextSizeControl color={color} />
      </View>
    </>
  );

  if (variant === 'hoeren') {
    const pool = attempt.answerOptions ?? [];
    const showLabels = attempt.passages.length > 1;
    return (
      <ExerciseFrame footer={footer} header={header}>
        <Hint icon="headset-outline" color={color}>
          {`${HOEREN_HOWTO} Dein Ergebnis siehst du, sobald du alles abgegeben hast.`}
        </Hint>
        {attempt.passages.map((p) => (
          <View key={p.id} style={[styles.clip, { borderColor: tint(color, '33') }]}>
            <AppText variant="subheading">{p.label}</AppText>
            <PassageBody passage={p} />
          </View>
        ))}
        {attempt.questions.map((q, i) => {
          const passage = q.sectionIndex != null ? attempt.passages[q.sectionIndex] : null;
          const n = q.questionNumber ?? i + 1;
          return (
            <View key={q.id} style={[styles.qCard, !!answers[q.id] && { borderColor: tint(color, '33') }]}>
              <View style={styles.qHead}>
                <NumberBadge n={n} done={!!answers[q.id]} color={color} />
                <AppText style={[styles.qPrompt, scaledText(BODY_SIZE, BODY_LINE, scale)]}>
                  {showLabels && passage ? `${passage.label}: ` : ''}
                  {q.prompt}
                </AppText>
              </View>
              <View style={styles.signs} accessibilityRole="radiogroup">
                {pool.map((option) => {
                  const picked = answers[q.id] === option;
                  const word = SIGN_WORD[option.toUpperCase()] ?? SIGN_WORD[option];
                  const yes = word === 'Richtig';
                  const fg = picked ? '#FFFFFF' : colors.ink;
                  return (
                    <PressableScale
                      key={option}
                      containerStyle={{ flex: 1 }}
                      accessibilityRole="radio"
                      accessibilityLabel={`Aufgabe ${n}: ${option}`}
                      accessibilityState={{ selected: picked, disabled: busy }}
                      disabled={busy}
                      onPress={() => set(q.id, option)}
                      style={[styles.sign, picked && { backgroundColor: color, borderColor: color }]}
                    >
                      <View style={[styles.signIcon, { backgroundColor: picked ? 'rgba(255,255,255,0.25)' : tint(color, '1F') }]}>
                        <Ionicons
                          name={word ? (yes ? 'checkmark' : 'close') : 'ellipse'}
                          size={16}
                          color={picked ? '#FFFFFF' : color}
                        />
                      </View>
                      <AppText style={[styles.signText, { color: fg }]}>{word ?? option}</AppText>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ExerciseFrame>
    );
  }

  const choicesFor = (q: ExamQuestionPublic): Choice[] =>
    isSituation
      ? [
          // Each ad may be used once: disable it in every other situation once picked ("x" stays free).
          ...attempt.passages.map((p) => ({
            value: p.id,
            label: p.label,
            disabled: Object.entries(answers).some(([id, a]) => id !== q.id && a === p.id),
          })),
          { value: NO_AD_ANSWER, label: 'x (keine Anzeige)' },
        ]
      : optionsFor(q, exercise.taskType, attempt.answerOptions ?? [], attempt.answerOptionLabels);

  return (
    <ExerciseFrame footer={footer} header={header}>
      <Hint icon={isCloze ? 'extension-puzzle-outline' : 'git-compare-outline'} color={color}>
        {isSituation
          ? 'Jede Anzeige darf nur einmal benutzt werden. Wenn keine Anzeige passt, wähle x.'
          : `Beantworte alle ${total} Aufgaben und tippe dann auf „Antworten abgeben“.`}
      </Hint>

      {attempt.passages.length > 0 ? (
        <ReadingCard
          passages={attempt.passages}
          title={isSituation ? 'Anzeigen' : undefined}
          icon={isSituation ? 'newspaper-outline' : 'book-outline'}
          color={color}
        />
      ) : null}
      {isCloze ? (
        <WordBank
          title="Wörter – nicht jedes passt in eine Lücke"
          answerOptions={attempt.answerOptions ?? []}
          labels={attempt.answerOptionLabels}
          color={color}
          used={new Set(Object.values(answers))}
        />
      ) : null}

      {attempt.questions.map((q, i) => {
        // SITUATION_MATCHING's passages are the answer ads, not a text the question refers to.
        const ref = !isSituation && !isCloze && q.sectionIndex != null ? attempt.passages[q.sectionIndex] : null;
        const n = q.questionNumber ?? i + 1;
        const choices = choicesFor(q);
        return (
          <View key={q.id} style={styles.qCard}>
            <View style={styles.qHead}>
              <NumberBadge n={n} done={!!answers[q.id]} color={color} />
              <AppText style={[styles.qPrompt, scaledText(BODY_SIZE, BODY_LINE, scale)]}>
                {isCloze ? `Lücke ${q.gapNumber ?? n}` : ''}
                {ref ? `${ref.label}: ` : ''}
                {isCloze ? '' : q.prompt}
              </AppText>
            </View>
            {isSituation ? (
              <View style={styles.adRow} accessibilityRole="radiogroup">
                {choices.map((c) => {
                  const picked = answers[q.id] === c.value;
                  return (
                    <PressableScale
                      key={c.value}
                      accessibilityRole="radio"
                      accessibilityLabel={`Aufgabe ${n}: ${c.label}`}
                      accessibilityState={{ selected: picked, disabled: busy || c.disabled }}
                      disabled={busy || c.disabled}
                      onPress={() => set(q.id, c.value)}
                      style={[
                        styles.ad,
                        picked && { backgroundColor: color, borderColor: color },
                        c.disabled && { opacity: 0.3 },
                      ]}
                    >
                      <AppText
                        style={{ fontWeight: '800', fontSize: 17 }}
                        color={picked ? '#FFFFFF' : colors.foreground}
                      >
                        {c.value === NO_AD_ANSWER ? 'x' : c.label}
                      </AppText>
                    </PressableScale>
                  );
                })}
              </View>
            ) : (
              <ChoiceField
                label={`Aufgabe ${n}`}
                value={answers[q.id] ?? ''}
                choices={choices}
                color={color}
                disabled={busy}
                onChange={(v) => set(q.id, v)}
              />
            )}
          </View>
        );
      })}
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  clip: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  qCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  qHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  qPrompt: { flex: 1, fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.ink },
  badge: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  signs: { flexDirection: 'row', gap: spacing.md },
  sign: {
    minHeight: 52,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  signIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  signText: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  adRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ad: {
    minWidth: MIN_TOUCH,
    height: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
