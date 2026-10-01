package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.RedemittelContext;
import com.deutschbridge.backend.model.enums.WritingPhraseCategory;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.deutschbridge.backend.model.enums.RedemittelContext.*;
import static com.deutschbridge.backend.model.enums.WritingPhraseCategory.*;

/**
 * Fills the learner-facing Redemittel fields of the built-in phrases: English meaning, grammar pattern
 * and contexts from {@code classpath:writing/redemittel-enrichment.json}, and - per level - explanation,
 * example sentence, usage note, grammar pattern, common mistake and similar expressions from
 * {@code classpath:writing/redemittel-details-<level>.json}. Only empty fields are
 * written, so anything an admin typed is never overwritten, and running it again changes nothing.
 */
final class RedemittelContentEnricher {

    /** Where each kind of expression is typically used, until an admin sets the contexts explicitly. */
    static final Map<WritingPhraseCategory, List<RedemittelContext>> DEFAULT_CONTEXTS = new EnumMap<>(WritingPhraseCategory.class);

    static {
        DEFAULT_CONTEXTS.put(GREETING, List.of(WRITING, EXAM, WORK));
        DEFAULT_CONTEXTS.put(INTRODUCTION, List.of(WRITING, EXAM));
        DEFAULT_CONTEXTS.put(OPINION, List.of(WRITING, DISCUSSION, EXAM));
        DEFAULT_CONTEXTS.put(REASON, List.of(WRITING, DISCUSSION, EXAM));
        DEFAULT_CONTEXTS.put(EXAMPLE, List.of(WRITING, DISCUSSION, EXAM));
        DEFAULT_CONTEXTS.put(ADDITION, List.of(WRITING, DISCUSSION));
        DEFAULT_CONTEXTS.put(CONTRAST, List.of(WRITING, DISCUSSION, EXAM));
        DEFAULT_CONTEXTS.put(AGREEMENT, List.of(DISCUSSION, SPEAKING, EVERYDAY));
        DEFAULT_CONTEXTS.put(DISAGREEMENT, List.of(DISCUSSION, SPEAKING, EVERYDAY));
        DEFAULT_CONTEXTS.put(ADVANTAGE_DISADVANTAGE, List.of(WRITING, DISCUSSION, EXAM));
        DEFAULT_CONTEXTS.put(SUGGESTION, List.of(EVERYDAY, SPEAKING, WRITING));
        DEFAULT_CONTEXTS.put(REQUEST, List.of(EVERYDAY, WORK, WRITING));
        DEFAULT_CONTEXTS.put(APOLOGY, List.of(EVERYDAY, WORK, WRITING));
        DEFAULT_CONTEXTS.put(QUESTION, List.of(EVERYDAY, WORK, WRITING));
        DEFAULT_CONTEXTS.put(CONCLUSION, List.of(WRITING, EXAM));
    }

    private RedemittelContentEnricher() {
    }

    /** Returns how many phrases were changed. */
    static int enrich(WritingPhraseRepository repository, ObjectMapper objectMapper) throws Exception {
        JsonNode root;
        try (InputStream in = RedemittelContentEnricher.class.getResourceAsStream("/writing/redemittel-enrichment.json")) {
            if (in == null) return 0;
            root = objectMapper.readTree(in);
        }
        JsonNode meanings = root.path("meanings");
        JsonNode grammar = root.path("grammar");

        Map<String, JsonNode> details = loadDetails(objectMapper);

        List<WritingPhrase> changed = new ArrayList<>();
        for (WritingPhrase p : repository.findAll()) {
            boolean changedHere = applyDetails(p, details.get(detailKey(p.getLevel(), p.getPhrase())));
            changedHere |= apply(p, meanings, grammar);
            if (changedHere) changed.add(p);
        }
        repository.saveAll(changed);
        return changed.size();
    }

    private static String detailKey(LearningLevel level, String phrase) {
        return level + "|" + phrase;
    }

    /** All entries of the per-level details files, keyed by "LEVEL|phrase text". */
    static Map<String, JsonNode> loadDetails(ObjectMapper objectMapper) throws Exception {
        Map<String, JsonNode> byKey = new HashMap<>();
        for (Resource file : new PathMatchingResourcePatternResolver().getResources("classpath:writing/redemittel-details-*.json")) {
            try (InputStream in = file.getInputStream()) {
                JsonNode root = objectMapper.readTree(in);
                LearningLevel level = LearningLevel.valueOf(root.path("level").asText());
                for (JsonNode n : root.path("phrases")) byKey.put(detailKey(level, n.path("phrase").asText()), n);
            }
        }
        return byKey;
    }

    /** Fills example, explanation, usage note, grammar pattern, common mistake and similar expressions where empty. */
    static boolean applyDetails(WritingPhrase p, JsonNode d) {
        if (d == null) return false;
        boolean changed = false;
        if (d.hasNonNull("example")) {
            // Fill an empty example, or replace the one-word stub that older installs were seeded with.
            boolean stub = d.hasNonNull("exampleReplaces") && d.get("exampleReplaces").asText().equals(p.getExample());
            if (isBlank(p.getExample()) || stub) {
                p.setExample(d.get("example").asText());
                changed = true;
            }
        }
        if (isBlank(p.getExplanation()) && d.hasNonNull("explanation")) {
            p.setExplanation(d.get("explanation").asText());
            changed = true;
        }
        if (isBlank(p.getUsageNote()) && d.hasNonNull("usageNote")) {
            p.setUsageNote(d.get("usageNote").asText());
            changed = true;
        }
        if (isBlank(p.getGrammarPattern()) && d.hasNonNull("grammarPattern")) {
            p.setGrammarPattern(d.get("grammarPattern").asText());
            changed = true;
        }
        if (isBlank(p.getCommonMistake()) && d.hasNonNull("commonMistake")) {
            p.setCommonMistake(d.get("commonMistake").asText());
            changed = true;
        }
        if (isBlank(p.getSimilarExpressions()) && d.path("similarExpressions").isArray()) {
            List<String> lines = new ArrayList<>();
            d.get("similarExpressions").forEach(n -> lines.add(n.asText()));
            p.setSimilarExpressions(RedemittelText.joinLines(lines));
            changed = true;
        }
        return changed;
    }

    static boolean apply(WritingPhrase p, JsonNode meanings, JsonNode grammar) {
        boolean changed = false;
        if (isBlank(p.getMeaningEn()) && meanings.hasNonNull(p.getPhrase())) {
            p.setMeaningEn(meanings.get(p.getPhrase()).asText());
            changed = true;
        }
        if (isBlank(p.getGrammarPattern()) && grammar.hasNonNull(p.getPhrase())) {
            p.setGrammarPattern(grammar.get(p.getPhrase()).asText());
            changed = true;
        }
        if (isBlank(p.getContexts()) && p.getCategory() != null) {
            p.setContexts(RedemittelText.joinContexts(DEFAULT_CONTEXTS.get(p.getCategory())));
            changed = true;
        }
        return changed;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
