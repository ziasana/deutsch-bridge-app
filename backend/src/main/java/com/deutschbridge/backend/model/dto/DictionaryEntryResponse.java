package com.deutschbridge.backend.model.dto;

import java.util.List;

public record DictionaryEntryResponse(
        String id,
        String lemma,
        String ipa,
        String audioUrl,
        String article,
        List<SenseResponse> senses,
        boolean savedByCurrentUser
) {
}
