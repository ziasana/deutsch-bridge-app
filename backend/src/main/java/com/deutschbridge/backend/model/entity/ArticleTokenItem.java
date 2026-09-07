package com.deutschbridge.backend.model.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * One token of a ReadingArticle's body, precomputed at ingest time (article create/update) so the
 * reading page renders clickable words from structured data instead of re-tokenizing raw text.
 * Stored as part of ReadingArticle.tokens (jsonb) rather than a separate table - tokens are always
 * loaded together with their article and never queried independently.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleTokenItem {
    private int index;
    private String text;
    private String lemma;
    private String pos;

    // Lombok's default isXxx() getter for a boolean field is auto-detected by Jackson as its own
    // "is-getter" property ("word", stripping the "is" prefix) *in addition to* the field itself -
    // producing both "word" and "isWord" in the JSON. Disable the Lombok getter and define the one
    // accessor explicitly so only "isWord" is serialized, matching the frontend's ArticleToken type.
    @Getter(AccessLevel.NONE)
    private boolean isWord;

    @JsonProperty("isWord")
    public boolean isWord() {
        return isWord;
    }
}
