package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

/**
 * Seeds the built-in "Mündlicher Ausdruck lernen" content of Telc and DTZ from the classpath (see below). A level + Teil
 * that already has content is left alone. Supporting another level only needs new JSON files.
 */
@Component
public class SpeakingGuideSeeder {

    private static final Logger log = LoggerFactory.getLogger(SpeakingGuideSeeder.class);

    @Bean
    public CommandLineRunner seedSpeakingGuides(SpeakingGuideService service, ObjectMapper mapper) {
        return args -> {
            // Telc: speaking/guide-<LEVEL>-teil<N>.json. DTZ (stored at level B1): speaking/dtz/guide-<LEVEL>-teil<N>.json.
            for (ExamType exam : List.of(ExamType.TELC, ExamType.DTZ)) {
                String folder = exam == ExamType.DTZ ? "speaking/dtz/" : "speaking/";
                for (LearningLevel level : LearningLevel.values()) {
                    for (int part = 1; part <= SpeakingGuideService.PARTS; part++) {
                        ClassPathResource file = new ClassPathResource(folder + "guide-" + level.getValue() + "-teil" + part + ".json");
                        if (!file.exists()) continue;
                        try (InputStream in = file.getInputStream()) {
                            JsonNode json = mapper.readTree(in);
                            if (service.seedIfMissing(exam, level, part, json)) log.info("Seeded speaking guide {} {} Teil {}", exam, level.getValue(), part);
                        } catch (Exception e) {
                            log.error("Could not seed speaking guide {} {} Teil {}", exam, level.getValue(), part, e);
                        }
                    }
                }
            }
        };
    }
}
