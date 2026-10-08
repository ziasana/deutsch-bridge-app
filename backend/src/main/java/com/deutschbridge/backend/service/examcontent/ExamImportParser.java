package com.deutschbridge.backend.service.examcontent;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Parses raw import text strictly. The importer deliberately does NOT repair AI output (stripping
 * Markdown fences, trailing commentary ...): it tells the admin exactly what is wrong instead, so a
 * bad generation is fixed at the source rather than silently altered.
 */
public final class ExamImportParser {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .enable(JsonParser.Feature.STRICT_DUPLICATE_DETECTION)
            .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS);

    private ExamImportParser() {
    }

    /** Either the parsed tree or a human-readable syntax error. */
    public record ParseResult(JsonNode root, String error) {
        public boolean ok() {
            return error == null;
        }
    }

    public static ParseResult parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return new ParseResult(null, "No JSON provided.");
        }
        String text = raw.startsWith("﻿") ? raw.substring(1) : raw;
        if (text.contains("```")) {
            return new ParseResult(null, "Invalid JSON — remove Markdown code fences (```) so only the JSON object remains.");
        }
        String trimmed = text.trim();
        if (!trimmed.startsWith("{")) {
            return new ParseResult(null, "Invalid JSON — the text must start with '{'. Remove any introduction before the JSON.");
        }
        try {
            JsonNode root = MAPPER.readTree(trimmed);
            if (root == null || !root.isObject()) {
                return new ParseResult(null, "Invalid JSON — the top level must be a JSON object.");
            }
            return new ParseResult(root, null);
        } catch (JsonProcessingException e) {
            var location = e.getLocation();
            String where = location != null ? " (line " + location.getLineNr() + ", column " + location.getColumnNr() + ")" : "";
            return new ParseResult(null, "Invalid JSON" + where + ": " + e.getOriginalMessage());
        }
    }
}
