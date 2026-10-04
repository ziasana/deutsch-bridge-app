package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamExerciseBookmark;
import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Runs the exam "saved for later" query against a real PostgreSQL (Testcontainers). */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class ExamExerciseBookmarkRepositoryIntegrationTest {

    @Autowired private ExamExerciseRepository exerciseRepository;
    @Autowired private ExamExerciseBookmarkRepository bookmarkRepository;
    @Autowired private ExamExerciseCompletionRepository completionRepository;
    @Autowired private UserRepository userRepository;

    private ExamExercise exercise(String title, LearningLevel level, boolean published) {
        ExamExercise exercise = new ExamExercise();
        exercise.setTitle(title);
        exercise.setSection(ExamSection.LESEVERSTEHEN);
        exercise.setLevel(level);
        exercise.setPublished(published);
        return exerciseRepository.save(exercise);
    }

    private void bookmark(User user, ExamExercise exercise) {
        ExamExerciseBookmark bookmark = new ExamExerciseBookmark();
        bookmark.setUserId(user.getId());
        bookmark.setExerciseId(exercise.getId());
        bookmarkRepository.save(bookmark);
    }

    private void completion(User user, ExamExercise exercise, Double lastScore) {
        ExamExerciseCompletion completion = new ExamExerciseCompletion();
        completion.setUserId(user.getId());
        completion.setExerciseId(exercise.getId());
        completion.setLastScore(lastScore);
        completionRepository.save(completion);
    }

    @Test
    @DisplayName("findPending -> should return unmastered, published bookmarks of this user, oldest first, across levels")
    void findPending_shouldReturnUnmasteredBookmarksOldestFirst() throws InterruptedException {
        User learner = userRepository.save(new User("Learner", "exam-pending-" + System.nanoTime() + "@test.local", "x"));
        User other = userRepository.save(new User("Other", "exam-pending-other-" + System.nanoTime() + "@test.local", "x"));
        ExamExercise first = exercise("First", LearningLevel.B2, true);
        ExamExercise second = exercise("Second", LearningLevel.A1, true);
        ExamExercise retry = exercise("Retry", LearningLevel.B1, true);
        ExamExercise mastered = exercise("Mastered", LearningLevel.A2, true);
        ExamExercise markedDone = exercise("Marked done", LearningLevel.A2, true);
        ExamExercise draft = exercise("Draft", LearningLevel.A2, false);
        ExamExercise othersOnly = exercise("Others", LearningLevel.A2, true);

        bookmark(learner, first);
        Thread.sleep(5);
        bookmark(learner, second);
        bookmark(learner, retry);
        bookmark(learner, mastered);
        bookmark(learner, markedDone);
        bookmark(learner, draft);
        bookmark(other, othersOnly);
        completion(learner, retry, 60.0);       // attempted but not mastered -> still pending
        completion(learner, mastered, 100.0);   // perfect score -> mastered
        completion(learner, markedDone, null);  // marked as done without a score -> mastered
        completion(other, first, 100.0);        // someone else's progress must not hide it

        List<String> pendingTitles = bookmarkRepository.findPending(learner.getId()).stream()
                .map(PendingExamBookmarkProjection::getTitle)
                .toList();

        assertEquals(List.of("First", "Second", "Retry"), pendingTitles);
    }
}
