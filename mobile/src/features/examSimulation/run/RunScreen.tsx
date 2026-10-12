import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { examSimulationApi } from '@/api/examSimulationApi';
import { ApiError } from '@/api/errors';
import { AppText, Button, ConfirmSheet, ErrorState, Skeleton } from '@/components/ui';
import { RichContentScale } from '@/features/exam/components/RichContentScale';
import { TextSizeControl } from '@/features/exam/components/kit';
import { colors, radius, spacing } from '@/theme';
import type { AnswerMap, AttemptState } from '@/types/examSimulation';
import { REJECTION_TEXT, SIM_SECTION, simulationErrorMessage } from '../format';
import { useExamAutosave } from '../useExamAutosave';
import { useServerCountdown } from '../useServerCountdown';
import { BottomBar } from './BottomBar';
import { PartTabs } from './PartTabs';
import { PartView } from './PartView';
import { PauseScreen } from './PauseScreen';
import { ExitSheet, FinishSheet, PaletteSheet, ReviewSheet } from './Sheets';
import { TimerHeader } from './TimerHeader';
import { countAnswered, partItems } from './partItems';
import { ScrollAnchorsProvider, useScrollAnchorController } from './scrollAnchors';
import { useQueryClient } from '@tanstack/react-query';
import { simKeys } from '../hooks';

/**
 * The running exam. The server owns the clock and decides what happens when a section ends; this screen shows the server's
 * time, autosaves every answer, and keeps the phone awake. Leaving the screen never stops the exam - only "Pause" does.
 */
export function RunScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { attempt: attemptId = '', fresh } = useLocalSearchParams<{ attempt?: string; fresh?: string }>();

  const [state, setState] = useState<AttemptState | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loadError, setLoadError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'exit' | 'finish' | 'palette' | null>(null);
  const [confirmSection, setConfirmSection] = useState(false);
  const [reviewState, setReviewState] = useState<AttemptState | null>(null);
  const [busy, setBusy] = useState(false);
  const [activePartKey, setActivePartKey] = useState<string | null>(null);
  const [accent, setAccent] = useState<string>(SIM_SECTION.LESEVERSTEHEN.color);
  const finishing = useRef(false);
  const anchors = useScrollAnchorController();
  const { scrollRef, contentRef } = anchors;

  const flash = useCallback((text: string) => {
    setNotice(text);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  const goToResult = useCallback(() => {
    if (!attemptId || finishing.current) return;
    finishing.current = true;
    void queryClient.invalidateQueries({ queryKey: simKeys.all });
    router.replace({ pathname: '/exam-prep/pruefung/ergebnis', params: { attempt: attemptId } });
  }, [attemptId, router, queryClient]);

  const applyState = useCallback(
    (next: AttemptState) => {
      if (next.status !== 'IN_PROGRESS') {
        goToResult();
        return;
      }
      if (next.parts[0]) setAccent(SIM_SECTION[next.parts[0].section]?.color ?? accent);
      setState((prev) => {
        if (prev && prev.currentStageIndex !== next.currentStageIndex) {
          flash(`Neuer Abschnitt: ${next.stages[next.currentStageIndex]?.label ?? ''}`);
          scrollRef.current?.scrollTo({ y: 0, animated: false });
          setActivePartKey(null);
        }
        return next;
      });
      setAnswers(next.answers);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goToResult, flash],
  );

  // A freshly started exam just reads its state; re-entering a running one (app restart, other device) is a resume.
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;
    const load = fresh === '1' ? examSimulationApi.attempt(attemptId) : examSimulationApi.resume(attemptId);
    load.then((res) => !cancelled && applyState(res)).catch((e) => !cancelled && setLoadError(e));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const refreshFromServer = useCallback(async () => {
    if (!attemptId) return;
    try {
      applyState(await examSimulationApi.attempt(attemptId));
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) flash(simulationErrorMessage(e, 'Der Zeitstand konnte nicht aktualisiert werden.'));
    }
  }, [attemptId, applyState, flash]);

  const autosave = useExamAutosave({
    attemptId,
    onRejected: (rejected) => {
      flash(REJECTION_TEXT[rejected[0].reason] ?? 'Eine Antwort konnte nicht gespeichert werden.');
      void refreshFromServer();
    },
    onFinished: () => void refreshFromServer(),
  });

  const stage = state ? state.stages[state.currentStageIndex] : null;
  // A paused exam has no running clock: the server's frozen remaining time is shown instead.
  const { remainingSeconds } = useServerCountdown(state?.paused ? null : (stage?.deadlineAtMs ?? null), state?.serverNowMs ?? 0, () => {
    // Display only: when the countdown ends, ask the server what happens next.
    void autosave.flushNow().then(() => refreshFromServer());
  });

  // A heads-up at 5 and 1 minute left, once per section.
  const warned = useRef('');
  useEffect(() => {
    if (!state || state.paused || !stage) return;
    const mark = remainingSeconds <= 60 ? '1' : remainingSeconds <= 300 ? '5' : '';
    if (!mark || remainingSeconds <= 0) return;
    const key = `${state.currentStageIndex}:${mark}`;
    if (warned.current.split(',').includes(key)) return;
    warned.current += `,${key}`;
    flash(mark === '1' ? 'Noch 1 Minute in diesem Abschnitt!' : 'Noch 5 Minuten in diesem Abschnitt.');
  }, [remainingSeconds, state, stage, flash]);

  // All sections used up: the server expects the exam to be finalised.
  useEffect(() => {
    if (state?.timeUp && attemptId) void examSimulationApi.submit(attemptId).finally(goToResult);
  }, [state?.timeUp, attemptId, goToResult]);

  // The phone must not lock during the exam.
  useEffect(() => {
    void activateKeepAwakeAsync('exam-simulation').catch(() => {});
    return () => void deactivateKeepAwake('exam-simulation').catch(() => {});
  }, []);

  // The Android back button never drops out of the exam by accident: it opens "Prüfung verlassen".
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet || reviewState || confirmSection) return false;
      setSheet('exit');
      return true;
    });
    return () => sub.remove();
  }, [sheet, reviewState, confirmSection]);

  const onAnswer = (partKey: string) => (questionId: string, answer: string | null, flagged: boolean) => {
    setAnswers((prev) => ({ ...prev, [partKey]: { ...prev[partKey], [questionId]: { answer, flagged } } }));
    autosave.enqueue({ partKey, questionId, answer, flagged });
  };

  const run = async (action: () => Promise<void>, failure: string) => {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      flash(simulationErrorMessage(e, failure));
      void refreshFromServer();
    } finally {
      setBusy(false);
    }
  };

  const endSection = () =>
    run(async () => {
      await autosave.flushNow();
      applyState(await examSimulationApi.completeSection(attemptId));
      setConfirmSection(false);
    }, 'Der Abschnitt konnte nicht beendet werden.').finally(() => setConfirmSection(false));

  const pauseExam = () =>
    run(async () => {
      await autosave.flushNow();
      const next = await examSimulationApi.pause(attemptId);
      setSheet(null);
      applyState(next);
    }, 'Die Prüfung konnte nicht pausiert werden.');

  const continueExam = () =>
    run(async () => applyState(await examSimulationApi.continue(attemptId)), 'Die Prüfung konnte nicht fortgesetzt werden.');

  const openReview = () => {
    setSheet(null);
    void run(async () => {
      await autosave.flushNow();
      const next = await examSimulationApi.attempt(attemptId);
      if (next.status !== 'IN_PROGRESS') return applyState(next);
      setReviewState(next);
    }, 'Die Übersicht konnte nicht geladen werden.');
  };

  const submit = () =>
    run(async () => {
      await autosave.flushNow();
      await examSimulationApi.submit(attemptId);
      goToResult();
    }, 'Die Prüfung konnte nicht abgegeben werden. Bitte versuche es erneut.');

  const leave = () => router.replace('/exam-prep/pruefung');

  if (!attemptId) {
    return (
      <View style={styles.center}>
        <AppText center>Keine Prüfung ausgewählt.</AppText>
        <Button pill label="Zur Übersicht" onPress={leave} />
      </View>
    );
  }
  if (loadError) {
    const notFound = loadError instanceof ApiError && loadError.status === 404;
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        {notFound ? <AppText center>Diese Prüfung wurde nicht gefunden.</AppText> : <ErrorState error={loadError} onRetry={() => router.replace({ pathname: '/exam-prep/pruefung/durchfuehrung', params: { attempt: attemptId } })} />}
        <Button pill variant="secondary" label="Zur Übersicht" onPress={leave} />
      </View>
    );
  }
  if (!state || !stage) {
    return (
      <View style={styles.center} accessibilityLabel="Prüfung wird geladen">
        <Stack.Screen options={{ gestureEnabled: false }} />
        <Skeleton height={64} />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </View>
    );
  }

  if (state.paused) {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <PauseScreen color={accent} stageLabel={stage.label} remainingSeconds={state.remainingSeconds} busy={busy} onContinue={() => void continueExam()} onFinish={openReview} onLeave={leave} />
        <ReviewSheet state={reviewState} submitting={busy} onConfirm={() => void submit()} onClose={() => setReviewState(null)} />
      </>
    );
  }

  const parts = state.parts;
  const isLastStage = state.currentStageIndex === state.stages.length - 1;
  const nextStage = state.stages[state.currentStageIndex + 1] ?? null;
  const activeIdx = Math.max(0, parts.findIndex((p) => p.key === activePartKey));
  const activePart = parts[activeIdx];
  const stageTotal = parts.reduce((n, p) => n + partItems(p).length, 0);
  const stageAnswered = parts.reduce((n, p) => n + countAnswered(p, answers), 0);
  const color = activePart ? (SIM_SECTION[activePart.section]?.color ?? accent) : accent;

  const selectPart = (key: string) => {
    setActivePartKey(key);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const pick = (partKey: string, itemId: string) => {
    setSheet(null);
    selectPart(partKey);
    // The part may have to be drawn first; the sheet needs a moment to close as well.
    setTimeout(() => anchors.scrollTo(itemId), 450);
  };

  return (
    <RichContentScale>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.root}>
        <TimerHeader
          color={color}
          stageLabel={stage.label}
          stageIndex={state.currentStageIndex}
          stageCount={state.stages.length}
          stages={state.stages}
          remainingSeconds={remainingSeconds}
          totalSeconds={stage.minutes * 60}
          autosave={autosave.status}
          onMenu={() => setSheet('exit')}
        />
        {notice ? (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <AppText variant="small" style={{ fontWeight: '700' }} color="#7A5000">
              {notice}
            </AppText>
          </View>
        ) : null}
        {parts.length > 1 && activePart ? <PartTabs parts={parts} answers={answers} activeKey={activePart.key} color={color} onSelect={selectPart} /> : null}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <ScrollAnchorsProvider register={anchors.register}>
              <View ref={contentRef} collapsable={false} style={{ gap: spacing.md }}>
                <View style={styles.sizeRow}>
                  <TextSizeControl color={color} />
                </View>
                {activePart ? (
                  <PartView
                    key={activePart.key}
                    attemptId={attemptId}
                    part={activePart}
                    answers={answers[activePart.key] ?? {}}
                    disabled={remainingSeconds <= 0}
                    onAnswer={onAnswer(activePart.key)}
                  />
                ) : null}
              </View>
            </ScrollAnchorsProvider>
          </ScrollView>
        </KeyboardAvoidingView>
        <BottomBar
          color={color}
          answered={stageAnswered}
          total={stageTotal}
          prevLabel={activeIdx > 0 ? parts[activeIdx - 1].label : null}
          nextLabel={activeIdx < parts.length - 1 ? parts[activeIdx + 1].label : null}
          busy={busy}
          onOverview={() => setSheet('palette')}
          onPrev={() => selectPart(parts[activeIdx - 1].key)}
          onNext={() => selectPart(parts[activeIdx + 1].key)}
          onFinish={() => setSheet('finish')}
        />
      </View>

      <PaletteSheet visible={sheet === 'palette'} parts={parts} answers={answers} color={color} activeKey={activePart?.key ?? ''} onPick={pick} onClose={() => setSheet(null)} />
      <ExitSheet visible={sheet === 'exit'} busy={busy} onPause={() => void pauseExam()} onFinish={openReview} onClose={() => setSheet(null)} />
      <FinishSheet
        visible={sheet === 'finish'}
        isLastStage={isLastStage}
        nextLabel={nextStage?.label ?? null}
        busy={busy}
        onEndSection={() => {
          setSheet(null);
          setConfirmSection(true);
        }}
        onSubmit={openReview}
        onClose={() => setSheet(null)}
      />
      <ConfirmSheet
        visible={confirmSection}
        title="Abschnitt beenden?"
        message="Du kannst danach nicht mehr zu diesem Abschnitt zurückkehren. Die Zeit des nächsten Abschnitts beginnt sofort."
        confirmLabel="Abschnitt beenden"
        cancelLabel="Abbrechen"
        onConfirm={() => void endSection()}
        onCancel={() => setConfirmSection(false)}
      />
      <ReviewSheet state={reviewState} submitting={busy} onConfirm={() => void submit()} onClose={() => setReviewState(null)} />
    </RichContentScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sizeRow: { alignItems: 'flex-end' },
  notice: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.warningSoft, borderRadius: radius.sm },
});
