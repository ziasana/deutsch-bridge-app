package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamPracticeSession;
import com.deutschbridge.backend.model.enums.ExamPracticeScope;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ExamPracticeSessionRepository extends JpaRepository<ExamPracticeSession, String> {

    /** Finished runs since a point in time. Abandoned runs (no completedAt) never count. */
    List<ExamPracticeSession> findByUserIdAndCompletedAtGreaterThanEqual(String userId, Instant since);

    List<ExamPracticeSession> findByUserIdAndLevelAndCompletedAtIsNotNull(String userId, LearningLevel level);

    /** Finished single-exercise runs of a section and level, newest first. */
    List<ExamPracticeSession> findByUserIdAndScopeAndSectionAndLevelAndCompletedAtIsNotNullOrderByCompletedAtDesc(
            String userId, ExamPracticeScope scope, ExamSection section, LearningLevel level);
}
