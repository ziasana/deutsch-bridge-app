package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamAttempt;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, String> {

    void deleteByExercise(ExamExercise exercise);

    List<ExamAttempt> findByUser(User user);

    /** Most recent exam exercise the learner opened but didn't finish, within a recency window. */
    Optional<ExamAttempt> findFirstByUserAndCompletedAtIsNullAndStartedAtAfterOrderByStartedAtDesc(
            User user, LocalDateTime startedAfter);

    boolean existsByUserAndCompletedAtAfter(User user, LocalDateTime after);
}
