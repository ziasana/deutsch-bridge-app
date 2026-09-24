package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.GrammarLevelViewResponse;
import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarCategoryTestAttempt;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.GrammarCategoryRepository;
import com.deutschbridge.backend.repository.GrammarCategoryTestAttemptRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import com.deutschbridge.backend.service.cache.GrammarProgressCacheService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/** Learner-facing grammar reads: the per-user merge onto cached level content, and DRAFT hiding. */
@ExtendWith(MockitoExtension.class)
class GrammarLearnerViewTest {

    @Mock private GrammarCategoryRepository categoryRepository;
    @Mock private GrammarLessonRepository lessonRepository;
    @Mock private GrammarCategoryTestAttemptRepository attemptRepository;
    @Mock private LearningProgressRepository learningProgressRepository;
    @Mock private UserService userService;
    @Mock private RequestContext requestContext;
    @Mock private ContentCacheService contentCacheService;
    @Mock private GrammarProgressCacheService grammarProgressCacheService;

    private User user() {
        User user = new User();
        user.setId("u1");
        user.setEmail("test@mail.com");
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        return user;
    }

    @Test
    @DisplayName("findLevelViewForLearner -> should merge learned flags and test status onto the cached rows")
    void findLevelViewForLearner_shouldMergeUserState() {
        GrammarCategoryService service = new GrammarCategoryService(categoryRepository, lessonRepository, attemptRepository,
                learningProgressRepository, userService, requestContext, contentCacheService);
        User user = user();

        ContentCacheService.GrammarLessonEntry inCategory = new ContentCacheService.GrammarLessonEntry(
                "l1", "Artikel", null, "der/die/das", null, LearningLevel.A1, 3);
        ContentCacheService.GrammarLessonEntry uncategorized = new ContentCacheService.GrammarLessonEntry(
                "l2", "Zahlen", null, "1-10", null, LearningLevel.A1, 0);
        ContentCacheService.GrammarCategoryEntry category = new ContentCacheService.GrammarCategoryEntry(
                "c1", "Block 1", "بلوک ۱", LearningLevel.A1, 0, 70, List.of(inCategory));
        when(contentCacheService.getGrammarLevelContent(LearningLevel.A1))
                .thenReturn(new ContentCacheService.GrammarLevelContent(List.of(category), List.of(uncategorized)));

        GrammarLesson lesson = new GrammarLesson();
        lesson.setId("l1");
        LearningProgress progress = new LearningProgress();
        progress.setLesson(lesson);
        progress.setIsLearned(true);
        when(learningProgressRepository.findByUserAndLessonIdIn(user, List.of("l1", "l2"))).thenReturn(List.of(progress));

        GrammarCategory categoryEntity = new GrammarCategory();
        categoryEntity.setId("c1");
        GrammarCategoryTestAttempt attempt = new GrammarCategoryTestAttempt();
        attempt.setCategory(categoryEntity);
        attempt.setScore(8);
        attempt.setTotal(10);
        attempt.setPassed(true);
        when(attemptRepository.findByUserAndCategoryIdIn(user, List.of("c1"))).thenReturn(List.of(attempt));

        GrammarLevelViewResponse view = service.findLevelViewForLearner(LearningLevel.A1);

        assertEquals("A1", view.level());
        assertTrue(view.categories().get(0).lessons().get(0).learned());
        assertEquals(3, view.categories().get(0).lessons().get(0).quizCount());
        assertTrue(view.categories().get(0).testStatus().attempted());
        assertEquals(8, view.categories().get(0).testStatus().score());
        assertFalse(view.uncategorized().get(0).learned());
    }

    @Test
    @DisplayName("findByIdWithLearningProgress -> should treat a DRAFT (not cached as published) lesson as not found")
    void findByIdWithLearningProgress_shouldHideDrafts() {
        GrammarService service = new GrammarService(lessonRepository, learningProgressRepository, categoryRepository,
                userService, requestContext, contentCacheService, grammarProgressCacheService);
        when(contentCacheService.getPublishedGrammarLesson("draft")).thenReturn(Optional.empty());

        assertThrows(DataNotFoundException.class, () -> service.findByIdWithLearningProgress("draft"));
    }

    @Test
    @DisplayName("findByIdForLearner -> should throw for an unknown category")
    void findByIdForLearner_shouldThrowWhenMissing() {
        GrammarCategoryService service = new GrammarCategoryService(categoryRepository, lessonRepository, attemptRepository,
                learningProgressRepository, userService, requestContext, contentCacheService);
        when(contentCacheService.getGrammarCategoryWithPublishedLessons("missing")).thenReturn(Optional.empty());

        assertThrows(DataNotFoundException.class, () -> service.findByIdForLearner("missing"));
    }
}
