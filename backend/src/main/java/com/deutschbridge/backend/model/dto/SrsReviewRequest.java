package com.deutschbridge.backend.model.dto;

public record SrsReviewRequest(
        String lemma,
        boolean correct
) {
}
