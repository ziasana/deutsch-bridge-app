import type { AnswerMap, PartState } from '@/types/examSimulation';
import { DONE_ID, WRITING_TEXT_ID } from '../format';

export type PartItem = { id: string; label: string };

/** The answerable things of a part: its questions, or the one pseudo-item of a writing / oral part. */
export function partItems(part: PartState): PartItem[] {
  if (part.section === 'SCHRIFTLICHER_AUSDRUCK') return [{ id: WRITING_TEXT_ID, label: 'Text' }];
  if (part.module === 'ORAL') return [{ id: DONE_ID, label: 'Geübt' }];
  let n = 1;
  return part.exercises.flatMap((e) =>
    e.questions.map((q) => ({ id: q.id, label: String(q.questionNumber ?? n++) })),
  );
}

export const isAnswered = (answers: AnswerMap, partKey: string, id: string): boolean =>
  !!answers[partKey]?.[id]?.answer?.trim();

export const countAnswered = (part: PartState, answers: AnswerMap): number =>
  partItems(part).filter((i) => isAnswered(answers, part.key, i.id)).length;
