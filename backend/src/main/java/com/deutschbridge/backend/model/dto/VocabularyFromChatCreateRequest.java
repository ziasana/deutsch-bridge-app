package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;

/** Creates a source=AI_TUTOR vocabulary item from a chat selection. Synonyms are generated
 *  server-side via OllamaService, same as VocabularyCreateRequest. */
public record VocabularyFromChatCreateRequest(
        String word,
        String meaning,
        String example,
        String sourceChatId,
        String sourceMessageId,
        LearningLevel level
) {
}
