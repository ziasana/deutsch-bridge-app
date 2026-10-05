import type { LearningProgress } from './grammar';

export type AnnotationType = 'WORD' | 'NOMEN_VERB_VERBINDUNG' | 'REDEWENDUNG';

/** Character offsets into `ReadingArticle.content` (end exclusive). */
export interface Span {
  start: number;
  end: number;
}

export interface Annotation {
  id: string;
  spans: Span[];
  surfaceText: string;
  type: AnnotationType;
  lemma: string;
  pos: string | null;
  gender: string | null;
  pluralForm: string | null;
  translationEn: string | null;
  literalTranslation: string | null;
  cefrLevel: string | null;
  exampleSentence: string | null;
  /** Known annotations are not highlighted. */
  known: boolean;
}

/** Concatenating all token texts reproduces `content` exactly. */
export interface ArticleToken {
  index: number;
  text: string;
  lemma: string;
  pos: string | null;
  isWord: boolean;
}

export interface KeyVocabularyItem {
  word: string;
  meaning: string;
}

export interface ReadingArticle {
  id: string;
  title: string;
  categoryId: string | null;
  categoryTitle: string | null;
  level: string;
  content: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: string;
  keyVocabulary: KeyVocabularyItem[];
  annotations: Annotation[];
  newWordCount: number;
  tokens: ArticleToken[];
  learningProgresses: LearningProgress[];
  bookmarked: boolean;
  quizCompleted: boolean;
}

export interface ReadingArticleSummary {
  id: string;
  title: string;
  categoryId: string | null;
  categoryTitle: string | null;
  level: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: string;
  newWordCount: number;
  learned: boolean;
  bookmarked: boolean;
}

export interface ReadingArticlePage {
  items: ReadingArticleSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ReadingLevelSummary {
  level: string;
  total: number;
  learned: number;
}

export interface ReadingCategory {
  id: string;
  title: string;
}

export interface ReadingArticleNavigation {
  previous: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

export type ReadingQuizQuestionType =
  'HAUPTIDEE' | 'DETAIL' | 'VOCAB_CONTEXT' | 'INFERENCE' | 'RICHTIG_FALSCH_NICHT_IM_TEXT';

export interface QuizQuestionPublic {
  id: string;
  type: ReadingQuizQuestionType;
  prompt: string;
  options: string[] | null;
}

export interface StartAttemptResponse {
  attemptId: string;
  questions: QuizQuestionPublic[];
}

export interface AnswerFeedbackResponse {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  supportingSentence: string;
  /** The annotated word this question tested; the app adds it to the learner's review list. */
  relatedLemma: string | null;
}

export type RecommendationType = 'LEVEL_UP' | 'EASIER' | 'CONTINUE';

export interface ArticleRecommendation {
  type: RecommendationType;
  suggestedArticleId: string | null;
  suggestedTitle: string | null;
  suggestedLevel: string | null;
  message: string;
}

export interface AttemptResultResponse {
  attemptId: string;
  comprehensionScore: number;
  vocabScore: number;
  recommendation: ArticleRecommendation;
}

export interface SaveLexiconRequest {
  lemma: string;
  type: AnnotationType;
  articleId: string;
  sentence: string;
  translation: string | null;
}

export interface DictionarySense {
  id: string;
  pos: string;
  translations: string[];
  examples: { id: string; de: string; en: string; audioUrl: string | null }[];
}

export interface DictionaryEntry {
  id: string;
  lemma: string;
  ipa: string | null;
  audioUrl: string | null;
  article: string | null;
  senses: DictionarySense[];
  savedByCurrentUser: boolean;
}
