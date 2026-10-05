import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText, BottomSheet, Button, Card, LearningCelebration } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ExamAnswerFeedback, ExamQuestionPublic, ExamTranscript } from '@/types/exam';
import type { ExamPracticeSessionResult } from '@/types/examTime';
import { isEmptyTranscript, isHtmlTranscript, plainParagraphs } from '../content';
import { ExamTimeSummary } from '../time/ExamTimeSummary';

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

/** Right/wrong, the correct answer and the exercise's tips for one question. */
export function FeedbackCard({
  feedback,
  title,
  formatAnswer,
  showTranscript = true,
}: {
  feedback: ExamAnswerFeedback;
  title?: string;
  formatAnswer?: (value: string) => string;
  showTranscript?: boolean;
}) {
  const ok = feedback.correct;
  return (
    <View style={[styles.feedback, ok ? styles.right : styles.wrong]}>
      <AppText
        variant="subheading"
        color={ok ? '#1B7A55' : colors.destructive}
        accessibilityRole="alert"
      >
        {title ? `${title}: ` : ''}
        {ok ? '✓ Richtig' : '✕ Falsch'}
      </AppText>
      {!ok ? (
        <AppText>
          Richtige Antwort:{' '}
          <AppText style={{ fontWeight: '700' }}>
            {formatAnswer ? formatAnswer(feedback.correctAnswer) : feedback.correctAnswer}
          </AppText>
        </AppText>
      ) : null}
      {feedback.explanation ? <AppText>💡 {feedback.explanation}</AppText> : null}
      {feedback.commonMistake ? (
        <AppText style={{ fontStyle: 'italic' }}>⚠️ Häufiger Fehler: {feedback.commonMistake}</AppText>
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

type ResultsProps = {
  results: ResultsState;
  defaultExplanation: string | null;
  defaultCommonMistake: string | null;
  formatAnswer?: (value: string) => string;
  /** Zeit-Check of the run that just ended, when the exercise was timed. */
  timeResult?: ExamPracticeSessionResult | null;
  onRetry: () => void;
};

export function ResultsView({
  results,
  defaultExplanation,
  defaultCommonMistake,
  formatAnswer,
  timeResult,
  onRetry,
}: ResultsProps) {
  const router = useRouter();
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const score = Math.round(results.score);
  const correct = results.items.filter((i) => i.feedback.correct).length;
  const hasTranscripts = results.transcripts.some((t) => !isEmptyTranscript(t.transcript));

  return (
    <View style={{ gap: spacing.md }}>
      <LearningCelebration
        title={score >= 80 ? 'Sehr gut!' : score >= 50 ? 'Gut gemacht!' : 'Weiter üben!'}
        subtitle={`${correct} von ${results.items.length} Aufgaben richtig`}
        progress={{ value: score, max: 100 }}
        progressLabel={`Ergebnis ${score}%`}
        primaryAction={{ label: 'Fertig', onPress: () => router.back() }}
      />
      {timeResult ? <ExamTimeSummary result={timeResult} /> : null}
      <Button label="Erneut üben" variant="secondary" onPress={onRetry} />

      {hasTranscripts ? (
        <>
          <Button
            label="Transkript anzeigen"
            variant="secondary"
            onPress={() => setTranscriptOpen(true)}
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

      {defaultExplanation || defaultCommonMistake ? (
        <Card tone="accent">
          {defaultExplanation ? <AppText>💡 {defaultExplanation}</AppText> : null}
          {defaultCommonMistake ? (
            <AppText style={{ fontStyle: 'italic' }}>⚠️ Häufiger Fehler: {defaultCommonMistake}</AppText>
          ) : null}
        </Card>
      ) : null}

      <View style={{ gap: spacing.md }}>
        {results.items.map((item, i) => (
          <FeedbackCard
            key={item.question.id}
            title={`Aufgabe ${item.question.questionNumber ?? i + 1}${item.question.prompt ? ` — ${item.question.prompt}` : ''}`}
            feedback={item.feedback}
            formatAnswer={formatAnswer}
            // One transcript link above covers every clip; don't repeat it under each question.
            showTranscript={!hasTranscripts}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  feedback: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  right: { backgroundColor: colors.successSoft, borderColor: colors.success },
  wrong: { backgroundColor: colors.destructiveSoft, borderColor: colors.destructive },
});
