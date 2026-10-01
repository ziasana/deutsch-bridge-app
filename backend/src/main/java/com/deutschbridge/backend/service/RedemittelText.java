package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.enums.RedemittelContext;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

/** (De)serialization of the list-valued Redemittel columns, which are stored as plain text. */
final class RedemittelText {

    private RedemittelText() {
    }

    static String joinLines(List<String> lines) {
        if (lines == null) return null;
        String joined = String.join("\n", lines.stream().filter(Objects::nonNull).map(String::strip).filter(s -> !s.isEmpty()).toList());
        return joined.isEmpty() ? null : joined;
    }

    static List<String> splitLines(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(text.split("\\R")).map(String::strip).filter(s -> !s.isEmpty()).toList();
    }

    static String joinContexts(List<RedemittelContext> contexts) {
        if (contexts == null || contexts.isEmpty()) return null;
        return String.join(",", contexts.stream().filter(Objects::nonNull).distinct().map(Enum::name).toList());
    }

    static List<RedemittelContext> splitContexts(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(text.split(","))
                .map(String::strip)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try {
                        return RedemittelContext.valueOf(s);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();
    }
}
