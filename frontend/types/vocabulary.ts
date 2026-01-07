export interface VocabularyContents {
    language: string;
    meaning: string;
}

export interface SaveVocabularyPracticeType {
    vocabularyId?: string;
    known: boolean
}

export interface GetVocabularyPracticeType {
    id?: string;
    successRate: number
}

export interface VocabularyPracticeType {
    id?: string
    word: string
    example: string
    synonyms?: string
    userEmail?: string
    vocabularyContents?: VocabularyContents[]
    vocabularyPractice?: GetVocabularyPracticeType[]
}

export interface VocabularyForPracticeType {
    id?: string
    word: string
    example: string
    synonyms: string
    meaning: string
}

export interface VocabularyType {
    id?: string
    word: string
    example: string
    synonyms?: string
    userEmail?: string
    vocabularyContents?: VocabularyContents[]
}

export interface UpdateVocabularyType {
    id?: string
    word: string
    example: string
    meaning: string
    language?: string
}

export interface DeleteVocabularyType {
    id?: string
    language?: string
}

export interface AddVocabularyType {
    word: string
    example: string
    meaning: string
    userEmail?: string
    language?: string
}
