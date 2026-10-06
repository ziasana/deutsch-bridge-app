import type {
  PracticeVocabularySession,
  VocabularyCreateRequest,
  VocabularyItem,
  VocabularyUpdateRequest,
  VocabularyRoundRequest,
  VocabularyRoundResponse,
} from '@/types/vocabulary';
import { api } from './client';

export type VocabularyCreateInput = VocabularyCreateRequest;

/** The slice of a vocabulary item the app needs to find the one created from a dictionary entry. */
export type VocabularyListItem = { id: string; dictionaryEntryId: string | null };

export const vocabularyApi = {
  /** Saves a dictionary entry to the learner's vocabulary. */
  addFromDictionary: (dictionaryEntryId: string) =>
    api.post<unknown>(`/vocabulary/from-dictionary/${encodeURIComponent(dictionaryEntryId)}`),
  /** Items that were added from the dictionary (used to undo a save: there is no delete-by-entry endpoint). */
  listFromDictionary: () => api.get<VocabularyListItem[]>('/vocabulary', { source: 'DICTIONARY' }),
  remove: (id: string) => api.delete<void>(`/vocabulary/${encodeURIComponent(id)}`),
  exists: (word: string) =>
    api.get<{ exists: boolean; vocabularyItemId: string | null }>('/vocabulary/exists', { word }),
  create: (input: VocabularyCreateInput) => api.post<VocabularyItem>('/vocabulary', input),
  /** The learner's whole list; the screen filters, searches and groups it. */
  list: () => api.get<VocabularyItem[]>('/vocabulary'),
  byId: (id: string) => api.get<VocabularyItem>(`/vocabulary/${encodeURIComponent(id)}`),
  update: (id: string, input: VocabularyUpdateRequest) =>
    api.put<VocabularyItem>(`/vocabulary/${encodeURIComponent(id)}`, input),
  addBookmark: (id: string) =>
    api.post<VocabularyItem>(`/vocabulary/${encodeURIComponent(id)}/bookmark`),
  removeBookmark: (id: string) =>
    api.delete<VocabularyItem>(`/vocabulary/${encodeURIComponent(id)}/bookmark`),
  /** AI-written example sentence for a word (counts against the AI limit). */
  generateExample: (word: string) =>
    api.postAi<{ word: string }>('/ollama/generate-example', { word }),
};

export const vocabularyPracticeApi = {
  getSession: (vocabularyItemId?: string) =>
    api.get<PracticeVocabularySession>('/vocabulary/practice/session', { vocabularyItemId }),
  submitRound: (request: VocabularyRoundRequest) =>
    api.post<VocabularyRoundResponse>('/vocabulary/practice/round', request),
};
