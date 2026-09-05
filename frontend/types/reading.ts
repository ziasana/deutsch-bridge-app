import { LearningProgress } from "@/types/grammar";

export interface KeyVocabularyItem {
    word: string;
    meaning: string;
}

export interface ReadingArticle {
    id: string;
    title: string;
    topic: string;
    level: string;
    content: string;
    keyVocabulary: KeyVocabularyItem[];
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
}

export interface SuggestVocabularyRequest {
    content: string;
    level: string;
}
