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

    @Test
    @DisplayName("daily words total includes the learner's own generated words, so learned never exceeds it")
    void dailyWordsTotalIncludesOwnWords() throws Exception {
        User user = new User();
        when(requestContext.getUserEmail()).thenReturn("a@b.c");
        when(userService.findByEmail("a@b.c")).thenReturn(user);
        when(repository.countByUserAndDailyWordIsNotNullAndIsLearnedTrue(user)).thenReturn(20L);
        when(dailyWords.countByAssignedToIsNull()).thenReturn(15L);
        when(dailyWords.countByAssignedTo(user)).thenReturn(30L);
        when(repository.countByUserAndIsLearnedTrueAndLearnedAtBetween(any(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(0L);

        OverviewResponse overview = service.getOverview();

        assertEquals(20, overview.dailyWords().learned());
        assertEquals(45, overview.dailyWords().total());
        assertTrue(overview.dailyWords().learned() <= overview.dailyWords().total());
        assertEquals(45, overview.totalAvailable());
    }
}
