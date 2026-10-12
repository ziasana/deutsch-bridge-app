package com.deutschbridge.backend.model.examsim;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/** One assessment criterion of a manually assessed part; the criteria maximums of a part must add up to the part maximum. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RubricCriterion(String key, String label, String description, BigDecimal maxPoints) {
}
