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
