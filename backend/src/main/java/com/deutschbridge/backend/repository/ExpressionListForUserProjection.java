package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import com.deutschbridge.backend.model.enums.ExpressionRegister;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.time.LocalDateTime;

/**
 * Row shape for the personalized list/continue-learning queries - list columns plus the current
 * user's live mastery level, weighted overall score and bookmark state, computed in SQL so
 * progress/bookmark filtering and progress-sort can stay a single paginated DB query.
 */
public interface ExpressionListForUserProjection {
    String getId();
    String getExpression();
    LearningLevel getLevel();
    String getMeaningDe();
    String getMeaningEn();
    ExpressionRegister getRegister();
    String getImageUrl();
    LocalDateTime getCreatedAt();
    ExpressionMasteryLevel getMasteryLevel();
    Double getOverallScore();
    Double getProductionScore();
    boolean isBookmarked();
}
