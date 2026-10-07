import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { WritingMode } from '@/types/writing';

interface Draft {
  text: string;
  plan: string[];
  mode: WritingMode;
  planDone: boolean;
}

export const WRITING_DRAFT_PREFIX = 'writing-draft-';
const key = (exerciseId: string) => `${WRITING_DRAFT_PREFIX}${exerciseId}`;

async function load(exerciseId: string): Promise<Partial<Draft>> {
  try {
    const raw = await AsyncStorage.getItem(key(exerciseId));
    return raw ? (JSON.parse(raw) as Partial<Draft>) : {};
  } catch {
    return {};
  }
}

const planOf = (saved: string[] | undefined, count: number) =>
  Array.from({ length: Math.max(count, saved?.length ?? 0, 1) }, (_, i) => saved?.[i] ?? '');

/**
 * The learner's in-progress text, planner notes and mode, autosaved to the device (debounced).
 * `ready` turns true once the saved draft has been read; storage can fail, so every access is guarded.
 */
export function useWritingDraft(exerciseId: string, leitpunkteCount: number) {
  const [ready, setReady] = useState(false);
  const [text, setText] = useState('');
  const [plan, setPlan] = useState<string[]>(() => planOf(undefined, leitpunkteCount));
  const [mode, setMode] = useState<WritingMode>('PRACTICE');
  const [planDone, setPlanDone] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    let alive = true;
    void load(exerciseId).then((d) => {
      if (!alive) return;
      setText(d.text ?? '');
      setPlan(planOf(d.plan, leitpunkteCount));
      setMode(d.mode ?? 'PRACTICE');
      setPlanDone(d.planDone ?? false);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [exerciseId, leitpunkteCount]);

  useEffect(() => {
    if (!ready) return;
    if (!dirty.current) {
      dirty.current = true; // the first run just reflects what was loaded
      return;
    }
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        key(exerciseId),
        JSON.stringify({ text, plan, mode, planDone } satisfies Draft),
      )
        .then(() => setSavedAt(new Date()))
        .catch(() => {
          /* storage unavailable: the draft just isn't persisted */
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [ready, exerciseId, text, plan, mode, planDone]);

  const clear = useCallback(() => {
    AsyncStorage.removeItem(key(exerciseId)).catch(() => {});
    setSavedAt(null);
  }, [exerciseId]);

  return {
    ready,
    text,
    setText,
    plan,
    setPlan,
    mode,
    setMode,
    planDone,
    setPlanDone,
    savedAt,
    clear,
  };
}
