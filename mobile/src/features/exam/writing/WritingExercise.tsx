import { useState } from 'react';
import { Alert, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText, Button, Card, Chip, LoadingState, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ExamExercise } from '@/types/exam';
import type { ExamPracticeSessionResult } from '@/types/examTime';
import type { WritingMode } from '@/types/writing';
import { ExamTimeSummary } from '../time/ExamTimeSummary';
import { AiFeedbackView, FeedbackView } from './components/FeedbackViews';
import { CompareView } from './components/CompareView';
import { HelpSheet } from './components/HelpSheet';
import { useWritingDraft } from './draft';
import { useRequestAiFeedback, useSubmitWriting, useWritingAttempts, useWritingLearning } from './hooks';
import { HELP_TABS_BY_MODE, WRITING_MODES, countWords } from './writingMeta';

type Props = {
  exercise: ExamExercise;
  /** Called after a successful submission (marks the exercise done and stops its timer). */
  onSubmitted: () => void;
  /** Zeit-Check of the run that ended with the submission. */
  timeResult?: ExamPracticeSessionResult | null;
};

/** Write flow for one task: (optional plan) → write with mode-dependent help → confirm → submit → feedback → revise. */
export function WritingExercise({ exercise, onSubmitted, timeResult }: Props) {
  const leitpunkte = exercise.leitpunkte ?? [];
  const draft = useWritingDraft(exercise.id, leitpunkte.length);
  const { text, mode } = draft;
  const attemptsQuery = useWritingAttempts(exercise.id);
  const submit = useSubmitWriting(exercise.id);
  const ai = useRequestAiFeedback(exercise.id);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [resultTab, setResultTab] = useState<'feedback' | 'compare'>('feedback');

  const attempts = attemptsQuery.data ?? [];
  const submitted = attempts.length > 0 ? attempts[attempts.length - 1] : null;
  // Reopening an exercise with attempts (and no unsent draft) lands on the latest result; revising
  // flips this to false and keeps the latest attempt as the parent of the next one.
  const [doneOverride, setDone] = useState<boolean | null>(null);
  const done = doneOverride ?? (submitted !== null && !text.trim());

  const helpTabs = HELP_TABS_BY_MODE[mode];
  const learning = useWritingLearning(exercise.level, helpOpen && helpTabs.length > 0);

  const planning = exercise.requiresPlanning && mode !== 'EXAM' && !draft.planDone && !submitted;
  const hasNotes = draft.plan.some((n) => n.trim());
  const words = countWords(text);

  const changeMode = (m: WritingMode) => {
    draft.setMode(m);
    if (m === 'EXAM') setHelpOpen(false);
  };

  const doSubmit = () =>
    submit.mutate(
      {
        exerciseId: exercise.id,
        text,
        mode,
        planNotes: mode === 'EXAM' ? [] : draft.plan,
        parentAttemptId: submitted?.id ?? null,
      },
      {
        onSuccess: () => {
          setDone(true);
          setResultTab('feedback');
          draft.clear();
          draft.setText('');
          onSubmitted();
        },
      },
    );

  const confirmSubmit = () =>
    Alert.alert('Bist du bereit, deinen Text abzugeben?', 'Du kannst ihn danach noch einmal überarbeiten.', [
      { text: 'Zurück', style: 'cancel' },
      { text: 'Abgeben', onPress: doSubmit },
    ]);

  if (!draft.ready || attemptsQuery.isPending) return <LoadingState label="Schreibaufgabe wird geladen …" />;

  const modeChips = (
    <View style={{ gap: spacing.xs }}>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {WRITING_MODES.map((m) => (
          <Chip key={m.mode} label={m.label} selected={mode === m.mode} onPress={() => changeMode(m.mode)} />
        ))}
      </View>
      <AppText variant="small" color={colors.mutedForeground}>
        {WRITING_MODES.find((m) => m.mode === mode)?.hint}
      </AppText>
    </View>
  );

  if (done && submitted) {
    return (
      <View style={{ gap: spacing.lg }}>
        <Card style={{ gap: spacing.md }}>
          <AppText variant="heading">✅ Text abgegeben</AppText>
          <AppText color={colors.mutedForeground}>
            Versuch {submitted.attemptNumber} · {submitted.wordCount} Wörter
          </AppText>
          <AppText>{submitted.text}</AppText>
        </Card>

        {timeResult ? <ExamTimeSummary result={timeResult} /> : null}

        {attempts.length > 1 ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Chip label="Feedback" selected={resultTab === 'feedback'} onPress={() => setResultTab('feedback')} />
            <Chip label="Original vs. Überarbeitung" selected={resultTab === 'compare'} onPress={() => setResultTab('compare')} />
          </View>
        ) : null}

        {resultTab === 'compare' && attempts.length > 1 ? (
          <CompareView attempts={attempts} />
        ) : submitted.feedback ? (
          <FeedbackView feedback={submitted.feedback} />
        ) : (
          <AppText color={colors.mutedForeground}>Für diesen Versuch ist kein Feedback verfügbar.</AppText>
        )}

        {resultTab === 'feedback' ? (
          submitted.aiFeedback ? (
            <AiFeedbackView feedback={submitted.aiFeedback} />
          ) : (
            <Card style={{ gap: spacing.sm }}>
              <AppText>Möchtest du genauere Hinweise zu Grammatik und Wortschatz?</AppText>
              {ai.error ? (
                <AppText color={colors.destructive} accessibilityRole="alert">
                  {ai.error.message}
                </AppText>
              ) : null}
              <Button
                label="🤖 KI-Feedback anfordern"
                variant="secondary"
                loading={ai.isPending}
                onPress={() => ai.mutate(submitted.id)}
              />
            </Card>
          )
        ) : null}

        <Card tone="accent" style={{ gap: spacing.sm }}>
          <AppText variant="subheading">🎯 Verbessere deinen Text</AppText>
          {submitted.feedback?.nextFocus.length ? (
            <>
              <AppText>Achte beim nächsten Versuch besonders auf:</AppText>
              {submitted.feedback.nextFocus.map((f) => (
                <AppText key={f}>• {f}</AppText>
              ))}
            </>
          ) : (
            <AppText>Du kannst deinen Text noch einmal lesen und verfeinern.</AppText>
          )}
          <Button
            label="Text überarbeiten"
            onPress={() => {
              // After a reload the editor state is empty, so start from the last submitted text.
              if (!text.trim()) draft.setText(submitted.text);
              setShowSolution(false);
              setDone(false);
            }}
          />
        </Card>

        {exercise.modelSolution ? (
          showSolution ? (
            <Card style={{ gap: spacing.sm }}>
              <AppText variant="subheading">Mögliche Lösung</AppText>
              <RichContent content={exercise.modelSolution} />
            </Card>
          ) : (
            <Button label="Mögliche Lösung anzeigen" variant="secondary" onPress={() => setShowSolution(true)} />
          )
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      {modeChips}

      {planning ? (
        <Card style={{ gap: spacing.md }}>
          <AppText variant="heading">📝 Plane deinen Text</AppText>
          <AppText color={colors.mutedForeground}>
            Notiere zu jedem Punkt ein paar Stichwörter – keine ganzen Sätze. Deine Notizen bleiben beim Schreiben sichtbar.
          </AppText>
          {(leitpunkte.length > 0 ? leitpunkte : ['Stichwörter und Ideen']).map((prompt, i) => (
            <TextField
              key={prompt}
              label={prompt}
              value={draft.plan[i] ?? ''}
              onChangeText={(v) => draft.setPlan(draft.plan.map((n, idx) => (idx === i ? v : n)))}
              multiline
              placeholder="Stichwörter …"
            />
          ))}
          <Button label="Weiter zum Schreiben" onPress={() => draft.setPlanDone(true)} />
        </Card>
      ) : (
        <>
          {mode !== 'EXAM' && hasNotes ? (
            <Card style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="subheading">📝 Deine Notizen</AppText>
                {exercise.requiresPlanning ? (
                  <AppText
                    accessibilityRole="button"
                    color={colors.primaryDark}
                    onPress={() => draft.setPlanDone(false)}
                  >
                    Bearbeiten
                  </AppText>
                ) : null}
              </View>
              {draft.plan.map((n, i) =>
                n.trim() ? (
                  <AppText key={i}>
                    • {leitpunkte[i] ? `${leitpunkte[i]} – ` : ''}
                    {n}
                  </AppText>
                ) : null,
              )}
            </Card>
          ) : null}

          <TextField
            label="Deine Antwort"
            value={text}
            onChangeText={draft.setText}
            multiline
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="sentences"
            placeholder="Schreibe hier deinen Text …"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="small" color={colors.mutedForeground} accessibilityLiveRegion="polite">
              Wörter: {words}
            </AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              {draft.savedAt
                ? `Entwurf gespeichert ${draft.savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </AppText>
          </View>

          {submit.error ? (
            <AppText color={colors.destructive} accessibilityRole="alert">
              {submit.error.message}
            </AppText>
          ) : null}
          {helpTabs.length > 0 ? (
            <Button label="Hilfe" variant="secondary" onPress={() => setHelpOpen(true)} />
          ) : null}
          <Button label="Abgeben" loading={submit.isPending} disabled={words === 0} onPress={confirmSubmit} />
        </>
      )}

      <HelpSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        tabs={helpTabs}
        data={learning.data}
        loading={learning.isPending && learning.fetchStatus !== 'idle'}
      />
    </View>
  );
}
