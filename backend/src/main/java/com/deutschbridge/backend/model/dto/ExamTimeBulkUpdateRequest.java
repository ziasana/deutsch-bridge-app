package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.math.BigDecimal;
import java.util.List;

/**
 * Bulk save for one level. recommendedMinutes is a BigDecimal so that "20.5" can be rejected
 * instead of being silently truncated by Jackson's float-to-int coercion.
 */
public record ExamTimeBulkUpdateRequest(
        LearningLevel level,
        /** Null leaves the level's total duration unchanged. */
        BigDecimal totalDurationMinutes,
        List<Entry> configurations
) {
    public record Entry(ExamSection section, Integer teil, BigDecimal recommendedMinutes, Boolean enabled) {
    }
}
