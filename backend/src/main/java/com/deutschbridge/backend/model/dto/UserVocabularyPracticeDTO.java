package com.deutschbridge.backend.model.dto;

import java.time.LocalDate;

public record UserVocabularyPracticeDTO(
        String id,
        int successRate,
        LocalDate lastPracticedAt
) {}