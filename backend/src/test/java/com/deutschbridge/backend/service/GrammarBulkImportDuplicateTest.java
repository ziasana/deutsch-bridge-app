package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.GrammarLessonManualRequest;
import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.GrammarCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Bulk-import duplicates are title + level + category, checked against a real PostgreSQL. */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class GrammarBulkImportDuplicateTest {

    @Autowired private GrammarService grammarService;
    @Autowired private GrammarCategoryRepository categoryRepository;

    private GrammarCategory nounsA1;
    private GrammarCategory verbsA1;
    private final String title = "Bulk dup test " + System.nanoTime();

    @BeforeEach
    void setUp() {
        nounsA1 = category("Nouns " + System.nanoTime(), LearningLevel.A1);
        verbsA1 = category("Verbs " + System.nanoTime(), LearningLevel.A1);
        grammarService.bulkImport(List.of(lesson(title, LearningLevel.A1, nounsA1.getId())));
    }

    private GrammarCategory category(String name, LearningLevel level) {
        GrammarCategory c = new GrammarCategory();
        c.setTitle(name);
        c.setLevel(level);
        return categoryRepository.save(c);
    }

    private static GrammarLessonManualRequest lesson(String title, LearningLevel level, String categoryId) {
        return new GrammarLessonManualRequest(title, level, null, "content", null, null, null, null, null, null,
                null, null, null, List.of(), categoryId, null);
    }

    @Test
    @DisplayName("same title + level + category as an existing lesson -> rejected")
    void sameTitleLevelCategoryIsDuplicate() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> grammarService.bulkImport(List.of(lesson(title.toUpperCase(), LearningLevel.A1, nounsA1.getId()))));
        assertTrue(e.getMessage().contains("already exists"), e.getMessage());
    }

    @Test
    @DisplayName("same title in a different category, a different level, or no category -> imported")
    void sameTitleElsewhereIsAllowed() {
        GrammarCategory nounsA2 = category("Nouns A2 " + System.nanoTime(), LearningLevel.A2);

        assertEquals(3, grammarService.bulkImport(List.of(
                lesson(title, LearningLevel.A1, verbsA1.getId()),
                lesson(title, LearningLevel.A2, nounsA2.getId()),
                lesson(title, LearningLevel.A1, null)
        )).size());
    }

    @Test
    @DisplayName("same title + level + category twice in one upload -> rejected; differing category in one upload -> fine")
    void duplicatesWithinBatch() {
        String fresh = "Fresh " + System.nanoTime();
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> grammarService.bulkImport(List.of(
                lesson(fresh, LearningLevel.A1, verbsA1.getId()),
                lesson(fresh, LearningLevel.A1, verbsA1.getId()))));
        assertTrue(e.getMessage().contains("duplicate lesson within the uploaded batch"), e.getMessage());

        assertEquals(2, grammarService.bulkImport(List.of(
                lesson(fresh, LearningLevel.A1, verbsA1.getId()),
                lesson(fresh, LearningLevel.A1, nounsA1.getId()))).size());
    }
}
