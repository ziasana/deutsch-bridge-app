package com.deutschbridge.backend.model.dto;

public record UserVocabResponse(
        String id,
        String entryId,
        String lemma,
        String article,
        String meaning,
        String status
) {
}
