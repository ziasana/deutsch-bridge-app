package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserArticleAttempt;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserArticleAttemptRepository extends JpaRepository<UserArticleAttempt, String> {

    List<UserArticleAttempt> findTop5ByUserAndArticleLevelAndCompletedAtIsNotNullOrderByCompletedAtDesc(
            User user, LearningLevel level);

    /** Most recent reading the learner opened but didn't finish, within a recency window. */
    Optional<UserArticleAttempt> findFirstByUserAndCompletedAtIsNullAndStartedAtAfterOrderByStartedAtDesc(
            User user, LocalDateTime startedAfter);
}
