package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ExpressionRegister;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.List;

public record ExpressionManualRequest(
        String expression,
        ExpressionType type,
        LearningLevel level,
        String meaningDe,
        String meaningEn,
        String meaningFa,
        String literalMeaning,
        String figurativeMeaning,
        String grammarNote,
        String usageNote,
        ExpressionRegister register,
        String commonMistakes,
        ExpressionStatus status,
        List<ExpressionExampleRequest> examples,
        List<ExpressionPatternRequest> patterns,
        List<ExpressionQuestionRequest> questions
) {
}
