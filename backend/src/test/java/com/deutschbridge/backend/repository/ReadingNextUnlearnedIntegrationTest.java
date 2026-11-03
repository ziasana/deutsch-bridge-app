package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** The dashboard's "next reading article" reads ids and titles only and skips what this learner has finished. */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class ReadingNextUnlearnedIntegrationTest {

    @Autowired private ReadingArticleRepository articleRepository;
    @Autowired private LearningProgressRepository progressRepository;
    @Autowired private UserRepository userRepository;

    private ReadingArticle article(LearningLevel level, String title, LocalDateTime createdAt) {
        ReadingArticle a = new ReadingArticle();
        a.setId(UUID.randomUUID().toString());
        a.setTitle(title);
        a.setContent("text");
        a.setLevel(level);
        a.setCreatedAt(createdAt);
        return articleRepository.save(a);
    }

    private void learned(User user, ReadingArticle article) {
        LearningProgress p = new LearningProgress();
        p.setUser(user);
        p.setReading(article);
        p.setIsLearned(true);
        progressRepository.save(p);
    }

    @Test
    @DisplayName("next unlearned article -> skips the learner's finished ones, only for that learner, falls back to any level")
    void nextUnlearned() {
        User learner = userRepository.save(new User("Learner", "reading-" + System.nanoTime() + "@test.local", "x"));
        User other = userRepository.save(new User("Other", "reading-o-" + System.nanoTime() + "@test.local", "x"));
        LocalDateTime now = LocalDateTime.now();
        // The level has no other articles in a fresh test database for C2; use it as an isolated level.
        ReadingArticle newer = article(LearningLevel.C2, "Neu", now);
        ReadingArticle older = article(LearningLevel.C2, "Alt", now.minusDays(1));
        PageRequest one = PageRequest.of(0, 1);

        assertEquals("Neu", articleRepository.findUnlearnedForUser(LearningLevel.C2, learner, one).get(0).getTitle());

        learned(learner, newer);
        assertEquals("Alt", articleRepository.findUnlearnedForUser(LearningLevel.C2, learner, one).get(0).getTitle());
        assertEquals("Neu", articleRepository.findUnlearnedForUser(LearningLevel.C2, other, one).get(0).getTitle());

        learned(learner, older);
        assertTrue(articleRepository.findUnlearnedForUser(LearningLevel.C2, learner, one).isEmpty());

        List<?> anyLevel = articleRepository.findUnlearnedForUserAnyLevel(other, one);
        assertFalse(anyLevel.isEmpty());
    }
}
