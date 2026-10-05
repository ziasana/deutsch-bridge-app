import type {
  AnswerFeedbackResponse,
  AttemptResultResponse,
  DictionaryEntry,
  ReadingArticle,
  ReadingArticleNavigation,
  ReadingArticlePage,
  ReadingCategory,
  ReadingLevelSummary,
  SaveLexiconRequest,
  StartAttemptResponse,
} from '@/types/reading';
import { api } from './client';

export type ReadingListParams = {
  level: string;
  search: string;
  bookmarked: boolean;
  categoryId: string;
};

export const readingApi = {
  levelSummary: () => api.get<ReadingLevelSummary[]>('/reading/level-summary'),
  categories: () => api.get<ReadingCategory[]>('/reading/categories'),
  /** Zero-based page. Empty filters are omitted so the backend can serve its cached list. */
  page: (p: ReadingListParams, page: number, size: number) =>
    api.get<ReadingArticlePage>('/reading', {
      level: p.level,
      page,
      size,
      search: p.search.trim() || undefined,
      bookmarked: p.bookmarked || undefined,
      categoryId: p.categoryId || undefined,
    }),
  article: (id: string) => api.get<ReadingArticle>(`/reading/${id}`),
  navigation: (id: string) => api.get<ReadingArticleNavigation>(`/reading/${id}/navigation`),
  recordView: (id: string) => api.post<{ viewCount: number }>(`/reading/${id}/view`),
  addBookmark: (id: string) => api.post<ReadingArticle>(`/reading/${id}/bookmark`),
  removeBookmark: (id: string) => api.delete<ReadingArticle>(`/reading/${id}/bookmark`),
  setLearned: (readingId: string, learned: boolean) =>
    api.post<unknown>('/learning-progress', { readingId, learned }),
};

export const readingQuizApi = {
  start: (articleId: string) => api.post<StartAttemptResponse>(`/reading/${articleId}/attempts`),
  answer: (attemptId: string, questionId: string, answer: string) =>
    api.post<AnswerFeedbackResponse>(`/reading/attempts/${attemptId}/answers`, {
      questionId,
      answer,
    }),
  complete: (attemptId: string, wordsTapped: string[], wordsSaved: string[]) =>
    api.post<AttemptResultResponse>(`/reading/attempts/${attemptId}/complete`, {
      wordsTapped,
      wordsSaved,
    }),
};

export const lexiconApi = {
  save: (request: SaveLexiconRequest) => api.post<unknown>('/lexicon', request),
  lookup: (lemma: string) => api.get<DictionaryEntry>(`/dictionary/${encodeURIComponent(lemma)}`),
};
