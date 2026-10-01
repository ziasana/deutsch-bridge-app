package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.WritingAiFeedback;
import com.deutschbridge.backend.model.dto.WritingAiFeedback.GrammarFix;

import java.util.ArrayList;
import java.util.List;

/**
 * Parses the line-based "KEY|value" format requested in {@link PromptLibrary#evaluateWriting}.
 * Tolerant by design: unknown or malformed lines are skipped and every list is capped.
 */
public class WritingAiFeedbackParser {
    static final int MAX_POSITIVES = 3;
    static final int MAX_MISSING = 3;
    static final int MAX_GRAMMAR = 5;
    static final int MAX_VOCABULARY = 3;
    static final int MAX_STRUCTURE = 3;

    private WritingAiFeedbackParser() {
        throw new IllegalStateException("Parser utils class");
    }

    public static WritingAiFeedback parse(String raw) {
        List<String> positives = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<GrammarFix> grammar = new ArrayList<>();
        List<String> vocabulary = new ArrayList<>();
        List<String> structure = new ArrayList<>();
        String example = null;

        if (raw != null) {
            for (String line : raw.split("\\R")) {
                int sep = line.indexOf('|');
                if (sep < 0) continue;
                String key = line.substring(0, sep).trim().toUpperCase().replaceAll("[^A-Z]", "");
                String value = line.substring(sep + 1).trim();
                if (value.isEmpty() || value.equals("-")) continue;
                switch (key) {
                    case "POSITIVE" -> add(positives, value, MAX_POSITIVES);
                    case "MISSING" -> add(missing, value, MAX_MISSING);
                    case "VOCAB" -> add(vocabulary, value, MAX_VOCABULARY);
                    case "STRUCTURE" -> add(structure, value, MAX_STRUCTURE);
                    case "EXAMPLE" -> example = example == null ? value : example;
                    case "GRAMMAR" -> {
                        GrammarFix fix = parseGrammar(value);
                        if (fix != null && grammar.size() < MAX_GRAMMAR) grammar.add(fix);
                    }
                    default -> { /* ignore unknown keys */ }
                }
            }
        }
        return new WritingAiFeedback(positives, missing, grammar, vocabulary, structure, example);
    }

    /** "original => corrected | explanation" (explanation optional). */
    private static GrammarFix parseGrammar(String value) {
        int arrow = value.indexOf("=>");
        if (arrow < 0) return null;
        String original = value.substring(0, arrow).trim();
        String rest = value.substring(arrow + 2);
        int bar = rest.indexOf('|');
        String corrected = (bar < 0 ? rest : rest.substring(0, bar)).trim();
        String explanation = bar < 0 ? "" : rest.substring(bar + 1).trim();
        if (original.isEmpty() || corrected.isEmpty()) return null;
        return new GrammarFix(original, corrected, explanation);
    }

    private static void add(List<String> target, String value, int max) {
        if (target.size() < max) target.add(value);
    }
}
