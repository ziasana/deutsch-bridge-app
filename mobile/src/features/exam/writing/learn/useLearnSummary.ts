import { useMemo } from 'react';
import { useWritingLearning } from '../hooks';
import { buildStations } from './stations';
import { useLearnProgress } from './useLearnProgress';

/** Stations finished vs. available at a level, for the entry card. Null while the content loads. */
export function useLearnSummary(level: string) {
  const learning = useWritingLearning(level, true);
  const { done } = useLearnProgress(level);
  const total = useMemo(
    () => (learning.data ? buildStations(learning.data, level).length : null),
    [learning.data, level],
  );
  const finished = total == null ? 0 : Object.keys(done).length;
  return { total, finished: Math.min(finished, total ?? 0) };
}
