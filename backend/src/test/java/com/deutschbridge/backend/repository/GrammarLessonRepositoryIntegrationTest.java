package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.GrammarService;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Runs the grammar learner-list queries against a real PostgreSQL (Testcontainers) - the per-level
 * view, the DRAFT exclusion, the per-level aggregates - and checks admin writes clear the caches.
 */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class GrammarLessonRepositoryIntegrationTest {

    @Autowired private GrammarLessonRepository lessonRepository;
    @Autowired private GrammarCategoryRepository categoryRepository;
    @Autowired private LearningProgressRepository learningProgressRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ContentCacheService contentCacheService;
    @Autowired private GrammarService grammarService;
    @Autowired private CacheManager cacheManager;

    private GrammarCategory category(LearningLevel level) {
        GrammarCategory category = new GrammarCategory();
        category.setTitle("Category " + System.nanoTime());
        category.setLevel(level);
        return categoryRepository.save(category);
    }

    private GrammarLesson lesson(LearningLevel level, GrammarCategory category, GrammarLessonStatus status) {
        GrammarLesson lesson = new GrammarLesson();
        lesson.setTitle("Lesson " + System.nanoTime());
        lesson.setLevel(level);
        lesson.setCategory(category);
        lesson.setStatus(status);
        return lessonRepository.save(lesson);
    }

    @Test
    @DisplayName("findForLevelView -> should return the level's categorized and uncategorized published lessons only")
    void findForLevelView_shouldScopeToLevelAndPublished() {
        GrammarCategory b1Category = category(LearningLevel.B1);
        GrammarCategory a2Category = category(LearningLevel.A2);
        GrammarLesson inB1Category = lesson(LearningLevel.B1, b1Category, GrammarLessonStatus.PUBLISHED);
        GrammarLesson uncategorizedB1 = lesson(LearningLevel.B1, null, GrammarLessonStatus.PUBLISHED);
        GrammarLesson draftB1 = lesson(LearningLevel.B1, b1Category, GrammarLessonStatus.DRAFT);
        GrammarLesson inA2Category = lesson(LearningLevel.A2, a2Category, GrammarLessonStatus.PUBLISHED);
        GrammarLesson uncategorizedA2 = lesson(LearningLevel.A2, null, GrammarLessonStatus.PUBLISHED);

        Set<String> ids = lessonRepository.findForLevelView(LearningLevel.B1, GrammarLessonStatus.PUBLISHED).stream()
                .map(GrammarLesson::getId)
                .collect(Collectors.toSet());

        assertTrue(ids.contains(inB1Category.getId()));
        assertTrue(ids.contains(uncategorizedB1.getId()));
        assertFalse(ids.contains(draftB1.getId()));
        assertFalse(ids.contains(inA2Category.getId()));
        assertFalse(ids.contains(uncategorizedA2.getId()));
    }

    @Test
    @DisplayName("getGrammarLevelContent -> should group lessons under their category and keep empty categories")
    void getGrammarLevelContent_shouldGroupByCategory() {
        GrammarCategory withLessons = category(LearningLevel.C1);
        GrammarCategory empty = category(LearningLevel.C1);
        GrammarLesson categorized = lesson(LearningLevel.C1, withLessons, GrammarLessonStatus.PUBLISHED);
        GrammarLesson uncategorized = lesson(LearningLevel.C1, null, GrammarLessonStatus.PUBLISHED);
        grammarService.saveLesson(uncategorized); // clears any cached C1 content from other tests

        ContentCacheService.GrammarLevelContent content = contentCacheService.getGrammarLevelContent(LearningLevel.C1);
        Map<String, ContentCacheService.GrammarCategoryEntry> byId = content.categories().stream()
                .collect(Collectors.toMap(ContentCacheService.GrammarCategoryEntry::id, c -> c));

        assertEquals(categorized.getId(), byId.get(withLessons.getId()).lessons().get(0).id());
        assertTrue(byId.get(empty.getId()).lessons().isEmpty());
        assertTrue(content.uncategorized().stream().anyMatch(l -> l.id().equals(uncategorized.getId())));
    }

    @Test
    @DisplayName("findByIdAndStatus -> should hide DRAFT lessons from the learner lookup")
    void findByIdAndStatus_shouldHideDrafts() {
        GrammarLesson draft = lesson(LearningLevel.A1, null, GrammarLessonStatus.DRAFT);
        GrammarLesson published = lesson(LearningLevel.A1, null, GrammarLessonStatus.PUBLISHED);

        assertTrue(lessonRepository.findByIdAndStatus(draft.getId(), GrammarLessonStatus.PUBLISHED).isEmpty());
        assertTrue(lessonRepository.findByIdAndStatus(published.getId(), GrammarLessonStatus.PUBLISHED).isPresent());
    }

    @Test
    @DisplayName("level aggregates -> should count published lessons and only this user's learned ones")
    void levelAggregates_shouldCountPublishedAndLearned() {
        GrammarLesson learnedLesson = lesson(LearningLevel.C2, null, GrammarLessonStatus.PUBLISHED);
        GrammarLesson draftLesson = lesson(LearningLevel.C2, null, GrammarLessonStatus.DRAFT);
        User learner = userRepository.save(new User("Learner", "grammar-" + System.nanoTime() + "@test.local", "x"));
        learned(learner, learnedLesson);
        learned(learner, draftLesson);

        Map<LearningLevel, Long> learnedByLevel = lessonRepository
                .countLearnedByLevelForUser(learner.getId(), GrammarLessonStatus.PUBLISHED).stream()
                .collect(Collectors.toMap(LevelCountProjection::getLevel, LevelCountProjection::getTotal));
        assertEquals(Map.of(LearningLevel.C2, 1L), learnedByLevel);

        Map<LearningLevel, Long> totals = lessonRepository.countByLevel(GrammarLessonStatus.PUBLISHED).stream()
                .collect(Collectors.toMap(LevelCountProjection::getLevel, LevelCountProjection::getTotal));
        assertTrue(totals.get(LearningLevel.C2) >= 1);
    }

    @Test
    @DisplayName("admin lesson writes -> should clear the cached level content")
    void adminWrite_shouldEvictLevelContent() {
        contentCacheService.getGrammarLevelContent(LearningLevel.A2);
        assertNotNull(cacheManager.getCache("grammarLevelContent").get(LearningLevel.A2));

        grammarService.saveLesson(lesson(LearningLevel.A2, null, GrammarLessonStatus.PUBLISHED));

        assertNull(cacheManager.getCache("grammarLevelContent").get(LearningLevel.A2));
    }

    private void learned(User user, GrammarLesson lesson) {
        LearningProgress progress = new LearningProgress();
        progress.setUser(user);
        progress.setLesson(lesson);
        progress.setIsLearned(true);
        learningProgressRepository.save(progress);
    }
}
