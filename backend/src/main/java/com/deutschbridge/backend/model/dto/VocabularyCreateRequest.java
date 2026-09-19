package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;

/** Always creates a source=CUSTOM item - see VocabularyController#addFromDictionary for saving a
 *  DictionaryEntry-backed word instead. Synonyms are generated server-side via OllamaService, not
 *  submitted by the client. */
public record VocabularyCreateRequest(
        String word,
        String article,
        String meaning,
        String language,
        String example,
        LearningLevel level
) {
}
