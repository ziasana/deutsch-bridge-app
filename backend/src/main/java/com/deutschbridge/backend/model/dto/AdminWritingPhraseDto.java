package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelContext;
import com.deutschbridge.backend.model.enums.WritingFormality;
import com.deutschbridge.backend.model.enums.WritingPhraseCategory;

import java.util.List;

/** Admin read/write shape of a Redemittel (the same record is used for requests and responses). */
public record AdminWritingPhraseDto(
        String id,
        LearningLevel level,
        WritingPhraseCategory category,
        String phrase,
        String explanation,
        String example,
        WritingFormality formality,
        String usageNote,
        int sortOrder,
        boolean active,
        String meaningEn,
        String meaningFa,
        String grammarPattern,
        String commonMistake,
        List<String> similarExpressions,
        List<RedemittelContext> contexts
) {
}
