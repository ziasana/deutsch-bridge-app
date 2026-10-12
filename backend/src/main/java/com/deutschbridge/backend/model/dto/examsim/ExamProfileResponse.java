package com.deutschbridge.backend.model.dto.examsim;

import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.enums.AnswerReleasePolicy;
import com.deutschbridge.backend.model.enums.ExamProfileStatus;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.OverallResultPolicy;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;

import java.math.BigDecimal;
import java.time.Instant;

public record ExamProfileResponse(
        String id,
        String code,
        int version,
        String provider,
        String examName,
        String title,
        String description,
        ExamType examType,
        LearningLevel level,
        ExamProfileStatus status,
        boolean editable,
        boolean oralScoringEnabled,
        BigDecimal writtenMaxPoints,
        BigDecimal writtenPassThreshold,
        BigDecimal oralMaxPoints,
        BigDecimal oralPassThreshold,
        BigDecimal totalMaxPoints,
        OverallResultPolicy overallResultPolicy,
        AnswerReleasePolicy answerReleasePolicy,
        Integer maxResumes,
        boolean excludePracticedExercises,
        ExamProfileConfig config,
        String verificationNote,
        String sourceProfileId,
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Instant publishedAt,
        String publishedBy
) {
    public static ExamProfileResponse of(ExamProfile p) {
        return new ExamProfileResponse(p.getId(), p.getCode(), p.getVersion(), p.getProvider(), p.getExamName(), p.getTitle(), p.getDescription(),
                p.getExamType(), p.getLevel(), p.getStatus(), p.isEditable(), p.isOralScoringEnabled(), p.getWrittenMaxPoints(),
                p.getWrittenPassThreshold(), p.getOralMaxPoints(), p.getOralPassThreshold(), p.getWrittenMaxPoints().add(p.getOralMaxPoints()),
                p.getOverallResultPolicy(), p.getAnswerReleasePolicy(), p.getMaxResumes(), p.isExcludePracticedExercises(), p.getConfig(),
                p.getVerificationNote(), p.getSourceProfileId(), p.getCreatedAt(), p.getCreatedBy(), p.getUpdatedAt(), p.getUpdatedBy(),
                p.getPublishedAt(), p.getPublishedBy());
    }
}
