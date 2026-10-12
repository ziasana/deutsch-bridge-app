package com.deutschbridge.backend.model.examsim;

import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.enums.AnswerReleasePolicy;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.OverallResultPolicy;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/** Everything about a profile that affects an attempt, copied into the attempt when it starts. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProfileSnapshot(
        String profileId,
        String code,
        int version,
        String provider,
        String examName,
        String title,
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
        ExamProfileConfig config
) {
    public static ProfileSnapshot of(ExamProfile p) {
        return new ProfileSnapshot(p.getId(), p.getCode(), p.getVersion(), p.getProvider(), p.getExamName(), p.getTitle(),
                p.getExamType(), p.getLevel(), p.isOralScoringEnabled(), p.getWrittenMaxPoints(), p.getWrittenPassThreshold(),
                p.getOralMaxPoints(), p.getOralPassThreshold(), p.getOverallResultPolicy(), p.getAnswerReleasePolicy(),
                p.getMaxResumes(), p.getConfig());
    }

    public BigDecimal totalMaxPoints() {
        return writtenMaxPoints.add(oralMaxPoints);
    }
}
