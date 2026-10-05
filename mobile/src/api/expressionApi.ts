import type {
  Expression,
  ExpressionCollectionSummary,
  ExpressionContinueLearning,
  ExpressionFilters,
  ExpressionNavigation,
  ExpressionPage,
  ExpressionType,
  PracticeSession,
  ProductionAnswerResponse,
  QuestionAnswerResponse,
  RecallAnswerResponse,
  TransformationAnswerResponse,
} from '@/types/expression';
import { api } from './client';

export const expressionApi = {
  collectionSummary: () =>
    api.get<ExpressionCollectionSummary[]>('/expressions/collection-summary'),

  /** Zero-based page. "ALL"/empty filters are omitted so the backend can serve its cached list. */
  page: (type: ExpressionType, page: number, size: number, f: ExpressionFilters) =>
    api.get<ExpressionPage>('/expressions', {
      type,
      page,
      size,
      level: f.level !== 'ALL' ? f.level : undefined,
      progress: f.progress !== 'ALL' ? f.progress : undefined,
      bookmarked: f.bookmarked || undefined,
      search: f.search.trim() || undefined,
      sort: f.sort,
    }),

  continueLearning: (type: ExpressionType) =>
    api.get<ExpressionContinueLearning>('/expressions/continue-learning', { type }),
  byId: (id: string) => api.get<Expression>(`/expressions/${id}`),
  navigation: (id: string) => api.get<ExpressionNavigation>(`/expressions/${id}/navigation`),
  markViewed: (id: string) => api.post<Expression>(`/expressions/${id}/view`),
  addBookmark: (id: string) => api.post<Expression>(`/expressions/${id}/bookmark`),
  removeBookmark: (id: string) => api.delete<Expression>(`/expressions/${id}/bookmark`),
};

export const expressionPracticeApi = {
  session: (expressionId?: string) =>
    api.get<PracticeSession>('/expressions/practice/session', { expressionId }),
  recall: (expressionId: string, userAnswer: string) =>
    api.post<RecallAnswerResponse>('/expressions/practice/recall', { expressionId, userAnswer }),
  question: (expressionId: string, questionId: string, selectedOptionId: string) =>
    api.post<QuestionAnswerResponse>('/expressions/practice/question', {
      expressionId,
      questionId,
      selectedOptionId,
    }),
  // The two sentence steps are judged by the backend's AI and count against the daily AI limit.
  transformation: (expressionId: string, questionId: string, sentence: string) =>
    api.postAi<TransformationAnswerResponse>('/expressions/practice/transformation', {
      expressionId,
      questionId,
      sentence,
    }),
  production: (expressionId: string, sentence: string) =>
    api.postAi<ProductionAnswerResponse>('/expressions/practice/production', {
      expressionId,
      sentence,
    }),
};
