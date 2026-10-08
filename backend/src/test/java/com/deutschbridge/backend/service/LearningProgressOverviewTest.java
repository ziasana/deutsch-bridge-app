package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.OverviewResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LearningProgressOverviewTest {

    private final LearningProgressRepository repository = mock(LearningProgressRepository.class);
    private final RequestContext requestContext = mock(RequestContext.class);
    private final UserService userService = mock(UserService.class);
    private final DailyWordRepository dailyWords = mock(DailyWordRepository.class);
    private final LearningProgressService service = new LearningProgressService(
            repository, requestContext, userService, mock(GrammarService.class),
            mock(VocabularyItemRepository.class), mock(VocabularyProgressRepository.class),
            mock(DailyWordService.class), mock(GrammarLessonRepository.class),
            mock(ExpressionRepository.class), mock(ExpressionProgressRepository.class), dailyWords,
            mock(ReadingArticleService.class), mock(ReadingArticleRepository.class),
            mock(GrammarCategoryRepository.class), mock(GrammarCategoryTestAttemptRepository.class),
            mock(ExamAttemptRepository.class), mock(LearningActivityService.class));

    private void learner(User user, long learned, long own, long sharedLearned) throws Exception {
        when(requestContext.getUserEmail()).thenReturn("a@b.c");
        when(userService.findByEmail("a@b.c")).thenReturn(user);
        when(repository.countByUserAndDailyWordIsNotNullAndIsLearnedTrue(user)).thenReturn(learned);
        when(dailyWords.countByAssignedTo(user)).thenReturn(own);
        when(repository.countLearnedSharedDailyWords(user)).thenReturn(sharedLearned);
        when(repository.countByUserAndIsLearnedTrueAndLearnedAtBetween(any(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(0L);
    }

    @Test
    @DisplayName("a new learner with 5 generated daily words shows 5 / 5, not the size of the shared pool")
    void totalIsTheLearnersOwnWords() throws Exception {
        User user = new User();
        learner(user, 5, 5, 0);

        OverviewResponse overview = service.getOverview();

        assertEquals(5, overview.dailyWords().learned());
        assertEquals(5, overview.dailyWords().total());
        assertEquals(5, overview.totalAvailable());
    }

    @Test
    @DisplayName("shared words the learner actually learned count towards the total, so learned never exceeds it")
    void learnedSharedWordsAreIncluded() throws Exception {
        User user = new User();
        learner(user, 8, 5, 3);

        OverviewResponse overview = service.getOverview();

        assertEquals(8, overview.dailyWords().learned());
        assertEquals(8, overview.dailyWords().total());
        assertTrue(overview.dailyWords().learned() <= overview.dailyWords().total());
    }
}
