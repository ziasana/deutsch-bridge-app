package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.AnnotationType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Pre-computed, human-reviewed annotation attached to a span of a ReadingArticle's text.
 * Stored as part of ReadingArticle.annotations (jsonb) - not its own JPA entity/table.
 * Spans can be non-contiguous (e.g. separable-verb Nomen-Verb-Verbindungen), hence a list of spans
 * rather than a single start/end pair.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Annotation {
    private String id;
    private List<Span> spans;
    private String surfaceText;
    private AnnotationType type;
    private String lemma;
    private String pos;
    private String gender;
    private String pluralForm;
    private String translationEn;
    private String literalTranslation;
    private LearningLevel cefrLevel;
    private String exampleSentence;

    public Annotation ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = NanoIdUtils.randomNanoId();
        }
        return this;
    }
}
