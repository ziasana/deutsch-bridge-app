package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ExamFieldPresetType;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;

public record ExamFieldPresetRequest(
        ExamSection section,
        LearningLevel level,
        ExamFieldPresetType fieldType,
        String label,
        String value
) {
}
