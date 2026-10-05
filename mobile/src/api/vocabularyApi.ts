import type {
  PracticeVocabularySession,
  VocabularyRoundRequest,
  VocabularyRoundResponse,
} from '@/types/vocabulary';
import { api } from './client';

export type VocabularyCreateInput = {
  word: string;
  article: string | null;
  meaning: string;
  language: string | null;
  example: string | null;
  level: string | null;
};

export const vocabularyApi = {
  exists: (word: string) =>
    api.get<{ exists: boolean; vocabularyItemId: string | null }>('/vocabulary/exists', { word }),
  create: (input: VocabularyCreateInput) => api.post<unknown>('/vocabulary', input),
};

export const vocabularyPracticeApi = {
  getSession: (vocabularyItemId?: string) =>
    api.get<PracticeVocabularySession>('/vocabulary/practice/session', { vocabularyItemId }),
  submitRound: (request: VocabularyRoundRequest) =>
    api.post<VocabularyRoundResponse>('/vocabulary/practice/round', request),
};
