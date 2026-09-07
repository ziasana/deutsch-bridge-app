package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.Span;
import com.deutschbridge.backend.model.enums.AnnotationType;

import java.util.List;

public record AnnotationResponse(
        String id,
        List<Span> spans,
        String surfaceText,
        AnnotationType type,
        String lemma,
        String pos,
        String gender,
        String pluralForm,
        String translationEn,
        String literalTranslation,
        String cefrLevel,
        String exampleSentence,
        boolean known
) {
}
