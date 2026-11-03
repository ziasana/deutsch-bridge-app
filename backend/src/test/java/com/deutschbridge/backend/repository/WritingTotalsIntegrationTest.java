package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.WritingAttempt;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** The writing totals of the dashboard are computed in SQL and only the newest attempts are read in full. */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class WritingTotalsIntegrationTest {

    @Autowired private WritingAttemptRepository repository;

    private void attempt(String userId, String exerciseId, int words, String parent, LocalDateTime at) {
        WritingAttempt a = new WritingAttempt();
        a.setId(UUID.randomUUID().toString());
        a.setUserId(userId);
        a.setExerciseId(exerciseId);
        a.setText("text");
        a.setWordCount(words);
        a.setParentAttemptId(parent);
        a.setSubmittedAt(at);
        repository.save(a);
    }

    @Test
    @DisplayName("totals -> counts, distinct exercises, revisions, words and the last submission; the newest page is limited")
    void totals() {
        String user = "user-" + UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        attempt(user, "e1", 10, null, now.minusDays(2));
        attempt(user, "e1", 20, "x", now.minusDays(1));
        attempt(user, "e2", 5, null, now);
        attempt("someone-else", "e1", 99, null, now);

        WritingAttemptRepository.WritingTotals totals = repository.totalsForUser(user);
        assertEquals(3, totals.getAttempts());
        assertEquals(2, totals.getExercises());
        assertEquals(1, totals.getRevisions());
        assertEquals(35, totals.getWords());
        assertNotNull(totals.getLastSubmittedAt());

        assertEquals(2, repository.findByUserIdOrderBySubmittedAtDesc(user, PageRequest.of(0, 2)).size());

        WritingAttemptRepository.WritingTotals none = repository.totalsForUser("nobody");
        assertEquals(0, none.getAttempts());
        assertEquals(0, none.getWords());
    }
}
