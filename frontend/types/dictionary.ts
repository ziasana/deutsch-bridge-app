export interface DictionaryExample {
    id: string;
    de: string;
    en: string;
    audioUrl: string | null;
}

export interface DictionarySense {
    id: string;
    pos: string;
    translations: string[];
    examples: DictionaryExample[];
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

export interface ReportMissingWordRequest {
    note: string | null;
}

export interface UserVocab {
    id: string;
    entryId: string;
    lemma: string;
    article: string | null;
    meaning: string | null;
    status: "new" | "learning" | "known";
}

export interface SaveVocabRequest {
    entryId: string;
}
