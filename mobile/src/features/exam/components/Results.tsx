import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText, BottomSheet, Button, Card, Chip, ProgressRing } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ExamAnswerFeedback, ExamQuestionPublic, ExamTranscript } from '@/types/exam';
import type { ExamPracticeSessionResult } from '@/types/examTime';
import { isEmptyTranscript, isHtmlTranscript, plainParagraphs } from '../content';
import { BODY_LINE, BODY_SIZE, scaledText, useExamTextScale } from '../textScale';
import { ExamTimeSummary } from '../time/ExamTimeSummary';
import { ExerciseFrame, StatTile, darken, tint } from './kit';

export interface ResultItem {
  question: ExamQuestionPublic;
  feedback: ExamAnswerFeedback;
}

export interface ResultsState {
  score: number;
  items: ResultItem[];
  transcripts: ExamTranscript[];
}

export function TranscriptContent({ transcript }: { transcript: string }) {
  if (isHtmlTranscript(transcript)) return <RichContent content={transcript} />;
  return (
    <View style={{ gap: spacing.md }}>
      {plainParagraphs(transcript).map((p, i) => (
        <AppText key={i}>{p}</AppText>
      ))}
    </View>
  );
}

/** Right answer, the exercise's tips and the transcript for one question. */
export function FeedbackCard({
  feedback,
  formatAnswer,
  showTranscript = true,
}: {
  feedback: ExamAnswerFeedback;
  formatAnswer?: (value: string) => string;
  showTranscript?: boolean;
}) {
  const body = scaledText(BODY_SIZE, BODY_LINE, useExamTextScale());
  const ok = feedback.correct;
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText
        variant="subheading"
        color={ok ? '#1B7A55' : colors.destructive}
        accessibilityRole="alert"
      >
        {ok ? '✓ Richtig' : '✕ Falsch'}
      </AppText>
      {!ok ? (
        <AppText style={body}>
          Richtige Antwort:{' '}
          <AppText style={{ fontWeight: '700' }}>
            {formatAnswer ? formatAnswer(feedback.correctAnswer) : feedback.correctAnswer}
          </AppText>
        </AppText>
      ) : null}
      {feedback.explanation ? <AppText style={body}>💡 {feedback.explanation}</AppText> : null}
      {feedback.commonMistake ? (
        <AppText style={[body, { fontStyle: 'italic' }]}>
          ⚠️ Häufiger Fehler: {feedback.commonMistake}
        </AppText>
      ) : null}
      {showTranscript && !isEmptyTranscript(feedback.transcript) ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.mutedForeground}>
            TRANSKRIPT
          </AppText>
          <TranscriptContent transcript={feedback.transcript ?? ''} />
        </View>
      ) : null}
    </View>
  );
}

/** One reviewed question: a one-line summary that unfolds into the explanation. Mistakes start open. */
function ReviewItem({
  index,
  item,
  formatAnswer,
  showTranscript,
}: {
  index: number;
  item: ResultItem;
  formatAnswer?: (value: string) => string;
  showTranscript: boolean;
}) {
  const ok = item.feedback.correct;
  const [open, setOpen] = useState(!ok);
  const n = item.question.questionNumber ?? index + 1;
  const accent = ok ? colors.success : colors.destructive;
  return (
    <View style={[styles.review, { borderColor: tint(accent, '33') }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aufgabe ${n}${item.question.prompt ? ` — ${item.question.prompt}` : ''}, ${ok ? 'richtig' : 'falsch'}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={[styles.reviewHead, { backgroundColor: tint(accent, '14') }]}
      >
        <View style={[styles.reviewDot, { backgroundColor: accent }]}>
          <Ionicons name={ok ? 'checkmark' : 'close'} size={16} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading">Aufgabe {n}</AppText>
          {item.question.prompt ? (
            <AppText
              variant="small"
              color={colors.mutedForeground}
              numberOfLines={open ? undefined : 1}
            >
              {item.question.prompt}
            </AppText>
          ) : null}
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.mutedForeground}
        />
      </Pressable>
      {open ? (
        <View style={styles.reviewBody}>
          <FeedbackCard
            feedback={item.feedback}
            formatAnswer={formatAnswer}
            showTranscript={showTranscript}
          />
        </View>
      ) : null}
    </View>
  );
}

type ResultsProps = {
  results: ResultsState;
  color: string;
  defaultExplanation: string | null;
  defaultCommonMistake: string | null;
  formatAnswer?: (value: string) => string;
  /** Zeit-Check of the run that just ended, when the exercise was timed. */
  timeResult?: ExamPracticeSessionResult | null;
  /** The next unfinished exercise of this Teil, offered as the main action. */
  next?: { id: string; title: string } | null;
  onRetry: () => void;
};

type Tier = { title: string; line: string; color: string; icon: keyof typeof Ionicons.glyphMap };
const tierFor = (score: number): Tier =>
  score >= 80
    ? {
        title: 'Sehr gut!',
        line: 'Stark – diese Übung sitzt.',
        color: colors.success,
        icon: 'trophy',
      }
    : score >= 50
      ? {
          title: 'Gut gemacht!',
          line: 'Schau dir die Fehler an – dann klappt es noch besser.',
          color: colors.primary,
          icon: 'thumbs-up',
        }
      : {
          title: 'Weiter üben!',
          line: 'Aus Fehlern lernt man. Lies die Erklärungen und versuche es nochmal.',
          color: colors.warning,
          icon: 'barbell',
        };

export function ResultsView({
  results,
  color,
  defaultExplanation,
  defaultCommonMistake,
  formatAnswer,
  timeResult,
  next,
  onRetry,
}: ResultsProps) {
  const router = useRouter();
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'WRONG'>('ALL');
  const score = Math.round(results.score);
  const total = results.items.length;
  const correct = results.items.filter((i) => i.feedback.correct).length;
  const wrong = total - correct;
  const hasTranscripts = results.transcripts.some((t) => !isEmptyTranscript(t.transcript));
  const tier = tierFor(score);

  // The ring pops in so the result feels like an event, not a table.
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
  }, [pop]);

  const shown = results.items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => filter === 'ALL' || !item.feedback.correct);

  const footer = (
    <>
      {next ? (
        <Button
          pill
          label="Nächste Übung"
          accessibilityHint={next.title}
          onPress={() =>
            router.replace({
              pathname: '/exam-prep/exercise/[exerciseId]',
              params: { exerciseId: next.id },
            })
          }
          color={color}
        />
      ) : (
        <Button pill label="Fertig" onPress={() => router.back()} color={color} />
      )}
      <View style={styles.footerRow}>
        <View style={{ flex: 1 }}>
          <Button label="Erneut üben" variant="secondary" onPress={onRetry} color={darken(color)} />
        </View>
        {next ? (
          <View style={{ flex: 1 }}>
            <Button
              label="Fertig"
              variant="secondary"
              onPress={() => router.back()}
              color={darken(color)}
            />
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <ExerciseFrame footer={footer}>
      <View style={[styles.hero, { backgroundColor: tint(tier.color, '14') }]}>
        <Animated.View style={{ transform: [{ scale: pop }], opacity: pop }}>
          <ProgressRing
            value={score}
            size={120}
            stroke={12}
            color={tier.color}
            textSize={30}
            label={`Ergebnis ${score}%`}
          />
        </Animated.View>
        <AppText variant="title" center accessibilityRole="header">
          {tier.title}
        </AppText>
        <AppText center color={colors.mutedForeground}>
          {`${correct} von ${total} Aufgaben richtig`}
        </AppText>
        <AppText variant="small" center color={colors.ink}>
          {tier.line}
        </AppText>
      </View>

      <View style={styles.tiles}>
        <StatTile
          icon="checkmark-circle"
          label="Richtig"
          value={String(correct)}
          color={colors.success}
        />
        <StatTile
          icon="close-circle"
          label="Falsch"
          value={String(wrong)}
          color={colors.destructive}
        />
        <StatTile icon="speedometer" label="Ergebnis" value={`${score}%`} color={color} />
      </View>

      {timeResult ? <ExamTimeSummary result={timeResult} /> : null}

      {defaultExplanation || defaultCommonMistake ? (
        <Card tone="accent">
          {defaultExplanation ? <AppText>💡 {defaultExplanation}</AppText> : null}
          {defaultCommonMistake ? (
            <AppText style={{ fontStyle: 'italic' }}>
              ⚠️ Häufiger Fehler: {defaultCommonMistake}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {hasTranscripts ? (
        <>
          <Button
            label="Transkript anzeigen"
            variant="secondary"
            onPress={() => setTranscriptOpen(true)}
            color={darken(color)}
          />
          <BottomSheet
            visible={transcriptOpen}
            onClose={() => setTranscriptOpen(false)}
            title="Transkript"
          >
            <View style={{ gap: spacing.lg }}>
              {results.transcripts
                .filter((t) => !isEmptyTranscript(t.transcript))
                .map((t, i) => (
                  <View key={i} style={{ gap: spacing.sm }}>
                    {t.label ? <AppText variant="subheading">{t.label}</AppText> : null}
                    <TranscriptContent transcript={t.transcript} />
                  </View>
                ))}
            </View>
          </BottomSheet>
        </>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <View style={styles.reviewTitle}>
          <AppText variant="heading" style={{ flex: 1 }}>
            Auswertung
          </AppText>
          <View
            style={styles.dots}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {results.items.map((r) => (
              <View
                key={r.question.id}
                style={[
                  styles.dot,
                  { backgroundColor: r.feedback.correct ? colors.success : colors.destructive },
                ]}
              />
            ))}
          </View>
        </View>
        {wrong > 0 ? (
          <View style={styles.filters}>
            <Chip
              label="Alle"
              selected={filter === 'ALL'}
              onPress={() => setFilter('ALL')}
              color={darken(color)}
            />
            <Chip
              label={`Fehler (${wrong})`}
              selected={filter === 'WRONG'}
              onPress={() => setFilter('WRONG')}
              color={darken(color)}
            />
          </View>
        ) : (
          <AppText variant="small" color={'#1B7A55'}>
            ✓ Keine Fehler – alles richtig beantwortet.
          </AppText>
        )}
        {shown.map(({ item, i }) => (
          <ReviewItem
            key={item.question.id}
            index={i}
            item={item}
            formatAnswer={formatAnswer}
            // One transcript link above covers every clip; don't repeat it under each question.
            showTranscript={!hasTranscripts}
          />
        ))}
      </View>
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, padding: spacing.lg, borderRadius: radius.lg },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  reviewTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    maxWidth: 140,
    justifyContent: 'flex-end',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  filters: { flexDirection: 'row', gap: spacing.sm },
  review: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 56,
  },
  reviewDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBody: { padding: spacing.lg, paddingTop: spacing.md },
});
