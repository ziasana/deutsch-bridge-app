package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ExamPracticeScope;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTimeMode;
import com.deutschbridge.backend.model.enums.LearningLevel;

/** EXERCISE scope needs exerciseId; TEIL scope needs section, level and teil. */
public record ExamPracticeSessionStartRequest(
        ExamPracticeScope scope,
        ExamTimeMode mode,
        String exerciseId,
        ExamSection section,
        LearningLevel level,
        Integer teil
) {
}
