package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserArticleAttempt;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserArticleAttemptRepository extends JpaRepository<UserArticleAttempt, String> {

    List<UserArticleAttempt> findTop5ByUserAndArticleLevelAndCompletedAtIsNotNullOrderByCompletedAtDesc(
            User user, LearningLevel level);
}
