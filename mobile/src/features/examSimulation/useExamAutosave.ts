import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { examSimulationApi } from '@/api/examSimulationApi';
import { ApiError } from '@/api/errors';
import type { AnswerItem, SaveAnswersResponse } from '@/types/examSimulation';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'retrying';

type Options = {
  attemptId: string;
  /** The server refused some answers (section locked ...). */
  onRejected: (rejected: SaveAnswersResponse['rejected']) => void;
  /** The server says the exam is over (time up or no longer running). */
  onFinished: () => void;
};

const DEBOUNCE_MS = 600;
const MAX_RETRY_MS = 15_000;

/**
 * Debounced, retrying answer upload. Edits are kept per question with a monotonically increasing client stamp, so a
 * delayed retry can never overwrite a newer answer on the server. Failed uploads stay queued and are retried with
 * back-off; nothing is dropped while the network is down. Leaving the app (or coming back online) flushes at once.
 */
export function useExamAutosave({ attemptId, onRejected, onFinished }: Options) {
  const pending = useRef(new Map<string, AnswerItem>());
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(2000);
  const stamp = useRef(0);
  const handlers = useRef({ onRejected, onFinished });
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  useEffect(() => {
    handlers.current = { onRejected, onFinished };
  });
  const [status, setStatus] = useState<AutosaveStatus>('idle');

  const flush = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return false;
    if (pending.current.size === 0) return true;
    inFlight.current = true;
    const batch = Array.from(pending.current.values());
    setStatus('saving');
    try {
      const response = await examSimulationApi.saveAnswers(attemptId, batch);
      // Only forget what was sent: an edit made while the request ran has a newer stamp and stays queued.
      for (const item of batch) {
        const key = `${item.partKey}|${item.questionId}`;
        if (pending.current.get(key)?.clientTs === item.clientTs) pending.current.delete(key);
      }
      retryDelay.current = 2000;
      setStatus(pending.current.size === 0 ? 'saved' : 'saving');
      if (response.rejected.length > 0) handlers.current.onRejected(response.rejected);
      if (response.timeUp || response.status !== 'IN_PROGRESS') handlers.current.onFinished();
      return true;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        // Expired, completed or cancelled: retrying is pointless.
        pending.current.clear();
        handlers.current.onFinished();
        return false;
      }
      setStatus('retrying');
      if (timer.current != null) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        void flushRef.current();
      }, retryDelay.current);
      retryDelay.current = Math.min(MAX_RETRY_MS, retryDelay.current * 2);
      return false;
    } finally {
      inFlight.current = false;
      if (pending.current.size > 0 && timer.current == null) {
        timer.current = setTimeout(() => {
          timer.current = null;
          void flushRef.current();
        }, DEBOUNCE_MS);
      }
    }
  }, [attemptId]);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const schedule = useCallback(() => {
    if (timer.current != null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void flush();
    }, DEBOUNCE_MS);
  }, [flush]);

  const enqueue = useCallback(
    (item: Omit<AnswerItem, 'clientTs'>) => {
      stamp.current = Math.max(stamp.current + 1, Date.now());
      pending.current.set(`${item.partKey}|${item.questionId}`, { ...item, clientTs: stamp.current });
      setStatus('saving');
      schedule();
    },
    [schedule],
  );

  /** Uploads everything now (section change, review, submit). Resolves true when nothing is left unsaved. */
  const flushNow = useCallback(async (): Promise<boolean> => {
    if (timer.current != null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      if (inFlight.current) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        continue;
      }
      if ((await flush()) && pending.current.size === 0) return true;
    }
    return pending.current.size === 0;
  }, [flush]);

  useEffect(() => {
    const app = AppState.addEventListener('change', (s) => {
      if (s !== 'active' && pending.current.size > 0) void flush();
    });
    const net = NetInfo.addEventListener((s) => {
      if (s.isConnected && pending.current.size > 0) void flush();
    });
    return () => {
      app.remove();
      net();
      if (timer.current != null) clearTimeout(timer.current);
    };
  }, [flush]);

  return { enqueue, flushNow, status, pendingCount: () => pending.current.size };
}
