package com.deutschbridge.backend.model.dto;

public record GrammarMasteryDto(
        int lessonsLearned,
        int lessonsTotal,
        int categoriesPassed,
        int categoriesAttempted,
        int categoriesTotal
) {
}
