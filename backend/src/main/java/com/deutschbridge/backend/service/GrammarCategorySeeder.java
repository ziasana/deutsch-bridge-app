package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.QuizQuestion;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.GrammarCategoryRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Seeds one example category so the curriculum-block feature has something to look at out of the box. */
@Component
public class GrammarCategorySeeder {

    private final Logger log;

    public GrammarCategorySeeder(Logger log) {
        this.log = log;
    }

    private static final Set<LearningLevel> TRANSLATABLE_LEVELS =
            Set.of(LearningLevel.A1, LearningLevel.A2, LearningLevel.B1);

    @Bean
    public CommandLineRunner seedGrammarCategories(GrammarCategoryRepository categoryRepository,
                                                     GrammarLessonRepository lessonRepository) {
        return args -> {
            GrammarCategory category = categoryRepository.count() == 0
                    ? null
                    : categoryRepository.findAllByOrderByLevelAscSortOrderAsc().get(0);

            // Whichever level currently has the most unassigned lessons is the most useful level
            // to demo the category feature with - real lesson data varies between environments.
            Map<LearningLevel, List<GrammarLesson>> unassignedByLevel = lessonRepository.findAll().stream()
                    .filter(l -> l.getCategory() == null && l.getLevel() != null)
                    .collect(Collectors.groupingBy(GrammarLesson::getLevel));

            if (category == null) {
                LearningLevel bestLevel = unassignedByLevel.entrySet().stream()
                        .max(Comparator.comparingInt(e -> e.getValue().size()))
                        .map(Map.Entry::getKey)
                        .orElse(LearningLevel.A1);

                category = new GrammarCategory();
                category.setTitle("Block 1: Erste Sätze");
                category.setTitleFa(TRANSLATABLE_LEVELS.contains(bestLevel) ? "بلوک ۱: اولین جمله‌ها" : null);
                category.setLevel(bestLevel);
                category.setSortOrder(0);
                category.setPassThreshold(70);
                category = categoryRepository.save(category);
                log.info("Seeded example grammar category \"{}\" for level {}", category.getTitle(), bestLevel);
            } else if (lessonRepository.findByCategory(category).isEmpty() && !unassignedByLevel.isEmpty()) {
                // The example category was seeded before any matching-level lessons existed - repoint
                // it at whichever level now actually has content, so the example stays useful.
                LearningLevel bestLevel = unassignedByLevel.entrySet().stream()
                        .max(Comparator.comparingInt(e -> e.getValue().size()))
                        .map(Map.Entry::getKey)
                        .orElse(category.getLevel());
                if (bestLevel != category.getLevel()) {
                    category.setLevel(bestLevel);
                    category.setTitleFa(TRANSLATABLE_LEVELS.contains(bestLevel) ? category.getTitleFa() : null);
                    category = categoryRepository.save(category);
                    log.info("Repointed example grammar category \"{}\" to level {}", category.getTitle(), bestLevel);
                }
            }

            List<GrammarLesson> toAssign = unassignedByLevel.getOrDefault(category.getLevel(), List.of());
            if (!toAssign.isEmpty()) {
                GrammarCategory finalCategory = category;
                toAssign.forEach(l -> l.setCategory(finalCategory));
                lessonRepository.saveAll(toAssign);
                log.info("Assigned {} lesson(s) to example category \"{}\"", toAssign.size(), finalCategory.getTitle());
            }

            // Give the example category a second topic too, so its aggregate test has more than one
            // lesson's worth of questions to draw from.
            String secondTitle = "Beispiel: Wortschatz-Wiederholung";
            if (lessonRepository.findByCategory(category).size() < 2 && !lessonRepository.existsByTitleIgnoreCase(secondTitle)) {
                GrammarLesson second = new GrammarLesson();
                second.setTitle(secondTitle);
                second.setLevel(category.getLevel());
                second.setSummary("A second example topic in this block, so its category test has more than one lesson's questions to pull from.");
                second.setContent("<p>This is a placeholder example topic. Replace its content, example and exercises with real material for this block, or delete it from the admin dashboard.</p>");
                second.setExample("Der Hund läuft schnell. (The dog runs fast.)");
                second.setUsageTips("Edit or delete this lesson from the admin Grammar Lessons page once you've added real content for this block.");
                second.setStatus(GrammarLessonStatus.PUBLISHED);
                second.setQuiz(List.of(
                        new QuizQuestion("mcq", "Sample question", "Was ist der Artikel von \"Hund\"?",
                                List.of("der", "die", "das"), "der", null, null),
                        new QuizQuestion("truefalse", "Sample question", "\"Schnell\" means \"slow\" in English.",
                                null, false, null, null)
                ));
                second.setCategory(category);
                lessonRepository.save(second);
                log.info("Seeded second example lesson \"{}\" in category \"{}\"", secondTitle, category.getTitle());
            }

            log.info("Example grammar category id: {}", category.getId());
        };
    }
}
