package com.deutschbridge.backend.model.dto.examsim;

import com.deutschbridge.backend.model.enums.AnswerReleasePolicy;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.OverallResultPolicy;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;

import java.math.BigDecimal;

/** Admin input for creating / editing a DRAFT profile. Code and version are not editable after creation. */
public record ExamProfileRequest(
        String code,
        String provider,
        String examName,
        String title,
        String description,
        ExamType examType,
        LearningLevel level,
        boolean oralScoringEnabled,
        BigDecimal writtenMaxPoints,
        BigDecimal writtenPassThreshold,
        BigDecimal oralMaxPoints,
        BigDecimal oralPassThreshold,
        OverallResultPolicy overallResultPolicy,
        AnswerReleasePolicy answerReleasePolicy,
        Integer maxResumes,
        boolean excludePracticedExercises,
        ExamProfileConfig config
) {
}
