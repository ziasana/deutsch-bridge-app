package com.deutschbridge.backend.model.dto;

import java.util.List;

/** No correct-answer info here - that's only revealed via VocabularyRoundResponse after
 *  submitting (see VocabularyPracticeService#generateContextQuestion). */
public record PracticeContextQuestionDto(
        String prompt,
        boolean isCloze,
        List<PracticeContextOptionDto> options
) {
}
