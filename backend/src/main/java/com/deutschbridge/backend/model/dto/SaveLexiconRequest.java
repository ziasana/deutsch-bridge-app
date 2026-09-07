package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.AnnotationType;

public record SaveLexiconRequest(
        String lemma,
        AnnotationType type,
        String articleId,
        String sentence,
        String translation
) {
}
