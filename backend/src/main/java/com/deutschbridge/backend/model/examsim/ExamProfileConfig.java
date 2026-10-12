package com.deutschbridge.backend.model.examsim;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.RoundingMode;
import java.util.List;

/**
 * The structural part of an exam profile, stored as JSONB: ordered parts, ordered timers and the rounding rule.
 *
 * @param scoreScale   decimal places part/total scores are rounded to
 * @param roundingMode a {@link RoundingMode} name
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExamProfileConfig(List<ExamPartConfig> parts, List<ExamTimerConfig> timers, Integer scoreScale, String roundingMode) {

    public List<ExamPartConfig> partsOrEmpty() {
        return parts != null ? parts : List.of();
    }

    public List<ExamTimerConfig> timersOrEmpty() {
        return timers != null ? timers : List.of();
    }

    public int scale() {
        return scoreScale != null ? scoreScale : 1;
    }

    public RoundingMode rounding() {
        if (roundingMode == null || roundingMode.isBlank()) return RoundingMode.HALF_UP;
        try {
            return RoundingMode.valueOf(roundingMode.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return RoundingMode.HALF_UP;
        }
    }

    public ExamPartConfig part(String key) {
        return partsOrEmpty().stream().filter(p -> p.key().equals(key)).findFirst().orElse(null);
    }
}
