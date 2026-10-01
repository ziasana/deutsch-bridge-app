package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.WritingGuideItem;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.WritingFormality;
import com.deutschbridge.backend.model.enums.WritingGuideKind;
import com.deutschbridge.backend.model.enums.WritingPhraseCategory;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.WritingGuideItemRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.InputStream;

/**
 * Seeds the built-in "Schreiben lernen" content from {@code classpath:writing/guide-*.json} - one
 * file per level. A level that already has rows is left alone, so admin edits survive restarts.
 * Supporting a new level only needs a new JSON file.
 */
@Component
public class WritingContentSeeder {

    private static final Logger log = LoggerFactory.getLogger(WritingContentSeeder.class);

    @Bean
    public CommandLineRunner seedWritingContent(WritingGuideItemRepository guideRepository,
                                                WritingPhraseRepository phraseRepository,
                                                RedemittelExerciseRepository exerciseRepository,
                                                ObjectMapper objectMapper,
                                                TransactionTemplate tx) {
        return args -> {
            Resource[] files = new PathMatchingResourcePatternResolver().getResources("classpath:writing/guide-*.json");
            for (Resource file : files) {
                try (InputStream in = file.getInputStream()) {
                    JsonNode root = objectMapper.readTree(in);
                    tx.executeWithoutResult(status -> seedLevel(root, guideRepository, phraseRepository, objectMapper));
                } catch (Exception e) {
                    log.error("Could not seed writing content from {}", file.getFilename(), e);
                }
            }
            try {
                int enriched = tx.execute(status -> {
                    try {
                        return RedemittelContentEnricher.enrich(phraseRepository, objectMapper);
                    } catch (Exception e) {
                        throw new IllegalStateException(e);
                    }
                });
                if (enriched > 0) log.info("Enriched {} Redemittel with meanings and contexts", enriched);
            } catch (Exception e) {
                log.error("Could not enrich Redemittel", e);
            }
            try {
                int added = tx.execute(status -> {
                    try {
                        return RedemittelExerciseSeeder.seed(phraseRepository, exerciseRepository, objectMapper);
                    } catch (Exception e) {
                        throw new IllegalStateException(e);
                    }
                });
                if (added > 0) log.info("Seeded {} Redemittel practice exercises", added);
            } catch (Exception e) {
                log.error("Could not seed Redemittel exercises", e);
            }
        };
    }

    private void seedLevel(JsonNode root, WritingGuideItemRepository guideRepository,
                           WritingPhraseRepository phraseRepository, ObjectMapper objectMapper) {
        LearningLevel level = LearningLevel.valueOf(root.path("level").asText());

        if (!guideRepository.existsByLevel(level)) {
            int order = 0;
            for (JsonNode n : root.path("items")) {
                WritingGuideItem item = new WritingGuideItem();
                item.setLevel(level);
                item.setKind(WritingGuideKind.valueOf(n.path("kind").asText()));
                item.setTitle(n.path("title").asText());
                item.setContent(n.hasNonNull("content") ? n.get("content").asText() : null);
                item.setData(n.hasNonNull("data") ? n.get("data").toString() : null);
                item.setSortOrder(order++);
                item.setActive(true);
                guideRepository.save(item);
            }
        }

        if (!phraseRepository.existsByLevel(level)) {
            int order = 0;
            for (JsonNode n : root.path("phrases")) {
                WritingPhrase p = new WritingPhrase();
                p.setLevel(level);
                p.setCategory(WritingPhraseCategory.valueOf(n.path("category").asText()));
                p.setPhrase(n.path("phrase").asText());
                p.setExplanation(n.hasNonNull("explanation") ? n.get("explanation").asText() : null);
                p.setExample(n.hasNonNull("example") ? n.get("example").asText() : null);
                p.setFormality(n.hasNonNull("formality") ? WritingFormality.valueOf(n.get("formality").asText()) : null);
                p.setUsageNote(n.hasNonNull("usageNote") ? n.get("usageNote").asText() : null);
                p.setSortOrder(order++);
                p.setActive(true);
                phraseRepository.save(p);
            }
        }
    }
}
