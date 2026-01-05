export interface VocabularyContents {
    language: string;
    meaning: string;
}
export interface VocabularyType {
    id?: number
    word: string
    example: string
    synonyms?: string
    userEmail?: string
    vocabularyContents?: VocabularyContents[]
}

export interface UpdateVocabularyType {
    id?: number
    word: string
    example: string
    meaning: string
    language?: string
}

export interface DeleteVocabularyType {
    id?: number
    language?: string
}

export interface AddVocabularyType {
    word: string
    example: string
    meaning: string
    userEmail?: string
    language?: string
}
