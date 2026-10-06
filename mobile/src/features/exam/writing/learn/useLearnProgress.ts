import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { writingApi } from '@/api/writingApi';
import type { WritingStationProgress } from '@/types/writing';
import { LEARN_SECTIONS, type LearnSectionId } from '../writingMeta';
import type { StationResult } from './types';

export const learnProgressKey = (level: string) => ['writing', 'learn-progress', level] as const;

const isStation = (s: string): s is LearnSectionId => LEARN_SECTIONS.some((x) => x.id === s);
const ratio = (r: StationResult) => (r.total === 0 ? 1 : r.correct / r.total);

/**
 * Which stations the learner finished at a level. The server is the source of truth, so progress
 * follows the learner across devices (and the web app); results are kept optimistically in the cache
 * so a failed save never loses what was just done.
 */
export function useLearnProgress(level: string) {
  const queryClient = useQueryClient();
  const key = learnProgressKey(level);
  const query = useQuery({
    queryKey: key,
    queryFn: () => writingApi.learnProgress(level),
    staleTime: 30_000,
  });

  const done: Partial<Record<LearnSectionId, StationResult>> = {};
  for (const s of query.data ?? []) {
    if (isStation(s.station)) done[s.station] = { correct: s.correct, total: s.total };
  }

  const save = useMutation({
    mutationFn: ({ id, result }: { id: LearnSectionId; result: StationResult }) =>
      writingApi.saveLearnProgress(level, id, result.correct, result.total),
  });
  const reset = useMutation({ mutationFn: () => writingApi.resetLearnProgress(level) });

  const markDone = (id: LearnSectionId, result: StationResult) => {
    const best = done[id] && ratio(done[id]!) > ratio(result) ? done[id]! : result;
    queryClient.setQueryData<WritingStationProgress[]>(key, (old = []) => [
      ...old.filter((o) => o.station !== id),
      { station: id, ...best },
    ]);
    save.mutate({ id, result: best });
  };

  const resetAll = () => {
    queryClient.setQueryData<WritingStationProgress[]>(key, []);
    reset.mutate();
  };

  return { done, markDone, reset: resetAll, loading: query.isPending };
}
