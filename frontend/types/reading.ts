import { LearningProgress } from "@/types/grammar";

export interface KeyVocabularyItem {
    word: string;
    meaning: string;
}

export type AnnotationType = "WORD" | "NOMEN_VERB_VERBINDUNG" | "REDEWENDUNG";

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
    known: boolean;
}

export type ReadingQuizQuestionType =
    | "HAUPTIDEE"
    | "DETAIL"
    | "VOCAB_CONTEXT"
    | "INFERENCE"
    | "RICHTIG_FALSCH_NICHT_IM_TEXT";

export interface ReadingQuizQuestion {
    id: string;
    type: ReadingQuizQuestionType;
    prompt: string;
    options: string[] | null;
    correctAnswer: string;
    relatedAnnotationId: string | null;
    explanation: string;
    supportingSentence: string;
    minLevel: string;
}

export interface ArticleToken {
    index: number;
    text: string;
    lemma: string;
    pos: string | null;
    isWord: boolean;
}

export interface ReadingArticle {
    id: string;
    title: string;
    topic: string;
    level: string;
    content: string;
    keyVocabulary: KeyVocabularyItem[];
    annotations: Annotation[];
    newWordCount: number;
    linkedGroupId: string | null;
    tokens: ArticleToken[];
    learningProgresses: LearningProgress[];
}

export interface ReadingArticleGenerateRequest {
    topic: string;
    level: string;
}

export interface ReadingArticleManualRequest {
    title: string;
    topic: string;
    level: string;
    content: string;
    keyVocabulary: KeyVocabularyItem[];
    annotations: Annotation[];
    quiz: ReadingQuizQuestion[];
    linkedGroupId: string | null;
}

export interface SuggestVocabularyRequest {
    content: string;
    level: string;
}

export interface SuggestAnnotationsRequest {
    content: string;
    level: string;
}

export interface GenerateQuizRequest {
    content: string;
    level: string;
    annotations: Annotation[];
}

// ---- Personal lexicon (spec 1.3) ----

export type WordProgressStatus = "NEW" | "LEARNING" | "KNOWN";

export interface UserWordProgress {
    id: string;
    lemma: string;
    type: AnnotationType;
    status: WordProgressStatus;
    firstSeenSentence: string | null;
    translation: string | null;
    timesSeen: number;
    savedAt: string;
    srsDueAt: string | null;
}

export interface SaveLexiconRequest {
    lemma: string;
    type: AnnotationType;
    articleId: string;
    sentence: string;
    translation: string | null;
}

export interface SrsReviewRequest {
    lemma: string;
    correct: boolean;
}

// ---- Quiz engine / attempts (spec section 4 / 1.4) ----

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

export interface SubmitAnswerRequest {
    questionId: string;
    answer: string;
}

export interface AnswerFeedbackResponse {
    correct: boolean;
    correctAnswer: string;
    explanation: string;
    supportingSentence: string;
    relatedLemma: string | null;
}

export interface CompleteAttemptRequest {
    wordsTapped: string[];
    wordsSaved: string[];
}

// ---- Adaptive difficulty (spec section 5) ----

export type RecommendationType = "LEVEL_UP" | "EASIER" | "CONTINUE";

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
