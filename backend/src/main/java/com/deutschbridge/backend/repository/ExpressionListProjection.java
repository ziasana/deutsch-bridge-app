package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.ExpressionRegister;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.time.LocalDateTime;

/** Row shape for ExpressionRepository.findListPage - list columns only, no examples/patterns/questions. */
public interface ExpressionListProjection {
    String getId();
    String getExpression();
    LearningLevel getLevel();
    String getMeaningDe();
    String getMeaningEn();
    ExpressionRegister getRegister();
    String getImageUrl();
    LocalDateTime getCreatedAt();
}
