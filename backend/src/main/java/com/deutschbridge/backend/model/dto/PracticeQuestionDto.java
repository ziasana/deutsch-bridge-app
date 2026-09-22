package com.deutschbridge.backend.model.dto;

import java.util.List;

/** No correct-answer info here - that's only revealed via QuestionAnswerResponse after submitting. */
public record PracticeQuestionDto(
        String id,
        String type,
        String format,
        String prompt,
        List<PracticeQuestionOptionDto> options
) {
}
