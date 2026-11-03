package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import com.deutschbridge.backend.model.enums.WordProgressStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** The flashcard queue is filtered and ordered in SQL: not KNOWN, never scheduled or already due, never-scheduled first, then the longest-waiting. */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class UserWordProgressDueIntegrationTest {

    @Autowired private UserWordProgressRepository repository;
    @Autowired private UserRepository userRepository;

    private void word(User user, String lemma, WordProgressStatus status, LocalDateTime dueAt) {
        UserWordProgress p = new UserWordProgress();
        p.setUser(user);
        p.setLemma(lemma);
        p.setStatus(status);
        p.setSrsDueAt(dueAt);
        repository.save(p);
    }

    @Test
    @DisplayName("findDueForReview -> due and never-scheduled cards of this learner only, never-scheduled first, then oldest due first")
    void dueQueue() {
        User learner = userRepository.save(new User("Learner", "words-" + System.nanoTime() + "@test.local", "x"));
        User other = userRepository.save(new User("Other", "words-o-" + System.nanoTime() + "@test.local", "x"));
        LocalDateTime saved = LocalDateTime.now();
        word(learner, "juengst", WordProgressStatus.NEW, saved.minusDays(1));
        word(learner, "aelter", WordProgressStatus.LEARNING, saved.minusDays(5));
        word(learner, "neu", WordProgressStatus.NEW, saved);
        // A row that was never scheduled (older rows): saving fills the date in, so clear it afterwards.
        UserWordProgress never = repository.findByUserAndLemma(learner, "neu").orElseThrow();
        never.setSrsDueAt(null);
        repository.saveAndFlush(never);
        word(learner, "spaeter", WordProgressStatus.LEARNING, saved.plusDays(3));
        word(learner, "bekannt", WordProgressStatus.KNOWN, saved.minusDays(2));
        word(other, "fremd", WordProgressStatus.NEW, saved.minusDays(9));

        LocalDateTime now = LocalDateTime.now();
        List<String> queue = repository.findDueForReview(learner, now).stream().map(UserWordProgress::getLemma).toList();

        assertEquals(List.of("neu", "aelter", "juengst"), queue);
    }
}
