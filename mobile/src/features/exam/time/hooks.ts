import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { examTimeApi } from '@/api/examTimeApi';
import type { ExamSection } from '@/types/exam';
import type {
  ExamExerciseLastTime,
  ExamPracticeSessionResult,
  ExamPracticeSessionStartRequest,
} from '@/types/examTime';
import {
  elapsedSecondsAt,
  getTimeStatus,
  isTimerStale,
  pausedSecondsAt,
  type TimeStatusResult,
} from './examTime';
import { useExamTimerStore, type ActiveExamTimer } from './timerStore';

/**
 * Recommended minutes for one Teil. `minutes` is null whenever there is no usable configuration
 * (none set, disabled, unknown level, request failed): callers must treat that as "no timing
 * information" and keep the exercise fully usable.
 */
export function useExamTimeConfiguration(
  level: string | null | undefined,
  section: ExamSection,
  teil: number | null | undefined,
) {
  const { data } = useQuery({
    queryKey: ['exam', 'time-configurations', level],
    queryFn: () => examTimeApi.configurations(level!),
    enabled: !!level,
    staleTime: 5 * 60_000,
  });
  const config = data?.find((c) => c.section === section && c.teil === teil) ?? null;
  return { minutes: config?.recommendedMinutes ?? null };
}

/** Last finished time per exercise id; empty while loading or if the request fails. */
export function useExerciseLastTimes(section: ExamSection | null, level: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ['exam', 'last-times', section, level],
    queryFn: () => examTimeApi.lastTimes(section!, level!),
    enabled: !!level && !!section,
  });
  return useMemo(
    () => Object.fromEntries((data ?? []).map((t) => [t.exerciseId, t])) as Record<string, ExamExerciseLastTime>,
    [data],
  );
}

export const useTimeManagement = (level: string) =>
  useQuery({
    queryKey: ['exam', 'time-management', level],
    queryFn: () => examTimeApi.timeManagement(level),
  });

/** Starts and finishes timed runs: the server records them, the store keeps the UI clock. */
export function useExamSession() {
  const active = useExamTimerStore((s) => s.active);
  const hasHydrated = useExamTimerStore((s) => s.hasHydrated);
  const [busy, setBusy] = useState(false);

  // A timer left over from long ago is dropped instead of resumed.
  useEffect(() => {
    const current = useExamTimerStore.getState().active;
    if (hasHydrated && current && isTimerStale(current, Date.now())) {
      useExamTimerStore.getState().clear();
    }
  }, [hasHydrated]);

  const start = useCallback(async (request: ExamPracticeSessionStartRequest) => {
    setBusy(true);
    try {
      useExamTimerStore.getState().start(await examTimeApi.startSession(request));
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * Ends the active run. The timer is cleared even when the request fails, so a network error never
   * leaves the learner with a running clock; the result is null in that case.
   */
  const finish = useCallback(async (): Promise<ExamPracticeSessionResult | null> => {
    const current = useExamTimerStore.getState().active;
    if (!current) return null;
    setBusy(true);
    try {
      return await examTimeApi.completeSession(current.sessionId, pausedSecondsAt(current, Date.now()));
    } catch {
      return null;
    } finally {
      useExamTimerStore.getState().clear();
      setBusy(false);
    }
  }, []);

  return { active: hasHydrated ? active : null, hasHydrated, busy, start, finish };
}

export interface ExamTimerView {
  elapsedSeconds: number;
  targetSeconds: number | null;
  isPaused: boolean;
  /** Null when there is no target to measure against. */
  status: TimeStatusResult | null;
  pause: () => void;
  resume: () => void;
}

/** Repaints once a second; the displayed time is always derived from the stored timestamps. */
export function useExamTimer(active: ActiveExamTimer | null): ExamTimerView {
  const [now, setNow] = useState(() => Date.now());
  const pause = useExamTimerStore((s) => s.pause);
  const resume = useExamTimerStore((s) => s.resume);
  const running = !!active && active.pausedAtMs == null;

  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [running]);

  return useMemo(() => {
    const elapsedSeconds = active ? elapsedSecondsAt(active, now) : 0;
    const targetSeconds = active?.targetSeconds ?? null;
    return {
      elapsedSeconds,
      targetSeconds,
      isPaused: !!active && active.pausedAtMs != null,
      status: targetSeconds != null ? getTimeStatus(elapsedSeconds, targetSeconds) : null,
      pause: () => pause(),
      resume: () => resume(),
    };
  }, [active, now, pause, resume]);
}

/**
 * Stops this exercise's timer (if it is the running one) and returns its Zeit-Check, which is also
 * remembered for the Teil list. Called when the result appears so the learner never stops it by hand.
 */
export function useStopExerciseTimer(exerciseId: string) {
  const { finish } = useExamSession();
  return useCallback(async () => {
    const active = useExamTimerStore.getState().active;
    if (active?.scope !== 'EXERCISE' || active.exerciseId !== exerciseId) return null;
    const result = await finish();
    if (result) useExamTimerStore.getState().setLastResult(result);
    return result;
  }, [exerciseId, finish]);
}
