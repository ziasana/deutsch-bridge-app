package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.AdminRedemittelExerciseDto;
import com.deutschbridge.backend.model.entity.RedemittelExercise;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.InputStream;
import java.util.*;

/**
 * Seeds the built-in practice exercises from {@code classpath:writing/redemittel-exercises-*.json}
 * (one file per level; each entry names a phrase by its text). A Redemittel that already has any
 * exercise is left alone, so whatever an admin wrote or changed is never overwritten or duplicated.
 */
final class RedemittelExerciseSeeder {

    private RedemittelExerciseSeeder() {
    }

    /** Returns how many exercises were added. */
    static int seed(WritingPhraseRepository phraseRepository, RedemittelExerciseRepository exerciseRepository, ObjectMapper objectMapper) throws Exception {
        int added = 0;
        for (Resource file : new PathMatchingResourcePatternResolver().getResources("classpath:writing/redemittel-exercises-*.json")) {
            try (InputStream in = file.getInputStream()) {
                added += seed(objectMapper.readTree(in), phraseRepository, exerciseRepository);
            }
        }
        return added;
    }

    static int seed(JsonNode root, WritingPhraseRepository phraseRepository, RedemittelExerciseRepository exerciseRepository) {
        LearningLevel level = LearningLevel.valueOf(root.path("level").asText());
        Map<String, WritingPhrase> byText = new HashMap<>();
        for (WritingPhrase p : phraseRepository.findAll()) {
            if (p.getLevel() == level) byText.putIfAbsent(p.getPhrase(), p);
        }
        Set<String> alreadyHave = new HashSet<>();
        for (Object[] row : exerciseRepository.countByPhrase()) alreadyHave.add((String) row[0]);

        Map<String, Integer> order = new HashMap<>();
        List<RedemittelExercise> toSave = new ArrayList<>();
        for (JsonNode n : root.path("exercises")) {
            WritingPhrase phrase = byText.get(n.path("phrase").asText());
            if (phrase == null || alreadyHave.contains(phrase.getId())) continue;
            List<String> wrong = new ArrayList<>();
            n.path("wrongAnswers").forEach(w -> wrong.add(w.asText()));
            AdminRedemittelExerciseDto dto = new AdminRedemittelExerciseDto(null,
                    RedemittelExerciseType.valueOf(n.path("type").asText()),
                    n.hasNonNull("prompt") ? n.get("prompt").asText() : null,
                    n.hasNonNull("correctAnswer") ? n.get("correctAnswer").asText() : null,
                    wrong, 0);
            // Same validation as the admin form, so a bad seed entry fails loudly instead of shipping broken questions.
            toSave.add(RedemittelExerciseAdminService.toEntity(phrase.getId(), dto, order.merge(phrase.getId(), 1, Integer::sum) - 1));
        }
        exerciseRepository.saveAll(toSave);
        return toSave.size();
    }
}
