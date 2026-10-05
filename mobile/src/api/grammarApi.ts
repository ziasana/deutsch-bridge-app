import type {
  CategoryTestStatus,
  ExerciseAnswer,
  GrammarCategoryWithLessons,
  GrammarLesson,
  GrammarLessonNavigation,
  GrammarLevelSummary,
  GrammarLevelView,
} from '@/types/grammar';
import { api } from './client';

export const grammarApi = {
  levelSummary: () => api.get<GrammarLevelSummary[]>('/grammar/level-summary'),
  levelView: (level: string) => api.get<GrammarLevelView>('/grammar', { level }),
  lesson: (id: string) => api.get<GrammarLesson>(`/grammar/${id}`),
  navigation: (id: string) => api.get<GrammarLessonNavigation>(`/grammar/${id}/navigation`),
  addBookmark: (id: string) => api.post<GrammarLesson>(`/grammar/${id}/bookmark`),
  removeBookmark: (id: string) => api.delete<GrammarLesson>(`/grammar/${id}/bookmark`),
  setLearned: (lessonId: string, learned: boolean) =>
    api.post<unknown>('/learning-progress', { lessonId, learned }),

  category: (id: string) => api.get<GrammarCategoryWithLessons>(`/grammar/categories/${id}`),
  // The score is computed on the device (same as web); the backend derives pass/fail from it.
  submitCategoryTest: (id: string, score: number, total: number) =>
    api.post<CategoryTestStatus>(`/grammar/categories/${id}/test-result`, { score, total }),
  markCategoryComplete: (id: string) =>
    api.post<CategoryTestStatus>(`/grammar/categories/${id}/test-result/complete`),
};

export const exerciseProgressApi = {
  list: () => api.get<ExerciseAnswer[]>('/exercise-progress'),
  save: (answer: ExerciseAnswer) => api.post<unknown>('/exercise-progress', answer),
  reset: (questionKeys: string[]) => api.delete<unknown>('/exercise-progress', questionKeys),
};
