package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;

/** How many published practice exercises exist for one exam, level and section; shown to visitors on the public exam pages. */
public record PublicExamCount(ExamType examType, LearningLevel level, ExamSection section, long count) {
}
