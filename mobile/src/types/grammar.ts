export interface QuizQuestion {
  type: 'mcq' | 'fill' | 'truefalse';
  title: string;
  question: string;
  options?: string[];
  answer: string | boolean;
  /** Persian translation of the instructions (A1–B1 only); options/answers stay language-invariant. */
  titleFa?: string | null;
  questionFa?: string | null;
}

export interface LearningProgress {
  id: string;
  learned: boolean;
}

export interface GrammarLesson {
  id: string;
  title: string;
  summary: string;
  /** Markdown and/or rich-text HTML. */
  content: string;
  level: string;
  example: string;
  usageTips: string;
  titleFa: string | null;
  summaryFa: string | null;
  contentFa: string | null;
  exampleFa: string | null;
  usageTipsFa: string | null;
  videoLink: string | null;
  quiz: QuizQuestion[];
  learningProgresses: LearningProgress[];
  categoryId: string | null;
  categoryTitle: string | null;
  sortOrder: number;
  bookmarked: boolean;
}

export interface CategoryTestStatus {
  attempted: boolean;
  score: number;
  total: number;
  passed: boolean;
  completed: boolean;
  passThreshold: number;
}

export interface GrammarCategoryWithLessons {
  id: string;
  title: string;
  titleFa: string | null;
  level: string;
  sortOrder: number;
  passThreshold: number;
  lessons: GrammarLesson[];
  testStatus: CategoryTestStatus;
}

/** Light list row (no content/quiz): fetch the lesson by id for those. */
export interface GrammarLessonSummary {
  id: string;
  title: string;
  titleFa: string | null;
  summary: string;
  summaryFa: string | null;
  level: string;
  quizCount: number;
  learned: boolean;
  bookmarked: boolean;
}

export interface GrammarCategorySummary {
  id: string;
  title: string;
  titleFa: string | null;
  level: string;
  sortOrder: number;
  passThreshold: number;
  lessons: GrammarLessonSummary[];
  testStatus: CategoryTestStatus;
}

export interface GrammarLevelView {
  level: string;
  categories: GrammarCategorySummary[];
  uncategorized: GrammarLessonSummary[];
}

export interface GrammarLevelSummary {
  level: string;
  total: number;
  learned: number;
}

export interface GrammarLessonNeighbor {
  id: string;
  title: string;
  titleFa: string | null;
  level: string;
}

export interface GrammarLessonNavigation {
  previous: GrammarLessonNeighbor | null;
  next: GrammarLessonNeighbor | null;
}

export interface ExerciseAnswer {
  questionKey: string;
  correct: boolean;
}
