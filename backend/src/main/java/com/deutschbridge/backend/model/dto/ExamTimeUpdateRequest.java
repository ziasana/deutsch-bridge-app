package com.deutschbridge.backend.model.dto;

import java.math.BigDecimal;

/** Single-row update; a null field is left unchanged. */
public record ExamTimeUpdateRequest(BigDecimal recommendedMinutes, Boolean enabled) {
}
