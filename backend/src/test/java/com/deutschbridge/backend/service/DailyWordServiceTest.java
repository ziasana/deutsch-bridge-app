package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.DailyWordResponse;
import com.deutschbridge.backend.model.entity.DailyWord;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.DailyWordRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DailyWordServiceTest {

    private final DailyWordRepository words = mock(DailyWordRepository.class);
    private final LearningProgressRepository progress = mock(LearningProgressRepository.class);
    private final UserService users = mock(UserService.class);
    private final RequestContext context = mock(RequestContext.class);
    private final OllamaService ollama = mock(OllamaService.class);
    private final DailyWordService service = new DailyWordService(words, progress, users, context, ollama);

    private DailyWord poolWord(String text) {
        DailyWord word = new DailyWord();
        word.setWord(text);
        word.setLevel(LearningLevel.A1);
        return word;
    }

    @Test
    @DisplayName("the dashboard shows the pool words at once and does not wait for a slow AI")
    void doesNotWaitForTheAi() throws Exception {
        User user = mock(User.class);
        when(user.getId()).thenReturn("u1");
        when(context.getUserEmail()).thenReturn("a@b.c");
        when(users.findByEmail("a@b.c")).thenReturn(user);
        when(words.findByAssignedToAndAssignedDate(any(), any())).thenReturn(List.of());
        when(words.findByLevelAndAssignedToIsNull(LearningLevel.A1)).thenReturn(List.of(poolWord("Haus"), poolWord("Baum")));

        CountDownLatch release = new CountDownLatch(1);
        CountDownLatch started = new CountDownLatch(1);
        when(ollama.generateDailyWords(any(), anyInt(), anyBoolean())).thenAnswer(inv -> {
            started.countDown();
            release.await(10, TimeUnit.SECONDS);
            return "";
        });

        long begin = System.nanoTime();
        List<DailyWordResponse> shown = assertTimeoutPreemptively(Duration.ofSeconds(3), service::getTodaysWordsForCurrentUser);
        assertTrue(Duration.ofNanos(System.nanoTime() - begin).toSeconds() < 3);
        assertFalse(shown.isEmpty());
        assertTrue(started.await(5, TimeUnit.SECONDS), "the AI generation runs in the background");
        release.countDown();
    }

    @Test
    @DisplayName("words already assigned for today are returned without any AI call")
    void assignedWordsSkipTheAi() {
        User user = mock(User.class);
        when(context.getUserEmail()).thenReturn("a@b.c");
        when(users.findByEmail("a@b.c")).thenReturn(user);
        when(words.findByAssignedToAndAssignedDate(any(), any())).thenReturn(List.of(poolWord("Haus")));

        assertEquals(1, service.getTodaysWordsForCurrentUser().size());
        verifyNoInteractions(ollama);
    }
}
