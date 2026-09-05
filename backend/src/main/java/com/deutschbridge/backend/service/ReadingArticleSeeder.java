package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ReadingArticleSeeder {

    private final Logger log;
    private final ReadingArticleService readingArticleService;

    public ReadingArticleSeeder(Logger log, ReadingArticleService readingArticleService) {
        this.log = log;
        this.readingArticleService = readingArticleService;
    }

    private static final Map<LearningLevel, List<String>> STARTER_TOPICS = Map.of(
            LearningLevel.A1, List.of("Mein Tag", "Im Supermarkt"),
            LearningLevel.A2, List.of("Ein Wochenende in Berlin", "Meine Familie"),
            LearningLevel.B1, List.of("Umweltschutz im Alltag", "Reisen mit dem Zug"),
            LearningLevel.B2, List.of("Die Zukunft der Arbeit", "Gesunde Ernährung")
    );

    @Bean
    public CommandLineRunner seedReadingArticles(ReadingArticleRepository repository) {
        return args -> {
            if (repository.count() > 0) return;

            int seeded = 0;
            for (Map.Entry<LearningLevel, List<String>> entry : STARTER_TOPICS.entrySet()) {
                for (String topic : entry.getValue()) {
                    try {
                        readingArticleService.generate(topic, entry.getKey());
                        seeded++;
                    } catch (Exception e) {
                        log.warn("Could not seed reading article for topic '{}' ({}): {}", topic, entry.getKey(), e.getMessage());
                    }
                }
            }
            log.info("Seeded {} reading articles!", seeded);
        };
    }
}
