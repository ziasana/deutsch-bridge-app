package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamExerciseBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ExamExerciseBookmarkRepository extends JpaRepository<ExamExerciseBookmark, String> {

    boolean existsByUserIdAndExerciseId(String userId, String exerciseId);

    List<ExamExerciseBookmark> findByUserId(String userId);

    @Transactional
    void deleteByUserIdAndExerciseId(String userId, String exerciseId);

    @Transactional
    void deleteByExerciseId(String exerciseId);

    /**
     * The user's bookmarks on published exercises they haven't mastered yet (no completion, or a last
     * score under 100), oldest bookmark first - the "saved for later" to-do list, across every level.
     */
    @Query("SELECT e.id AS id, e.title AS title, e.section AS section, e.level AS level, b.createdAt AS bookmarkedAt " +
            "FROM exam_exercise_bookmarks b JOIN examExercises e ON e.id = b.exerciseId " +
            "WHERE b.userId = :userId AND e.published = true AND NOT EXISTS (" +
            "SELECT 1 FROM exam_exercise_completions c WHERE c.userId = :userId AND c.exerciseId = e.id " +
            "AND (c.lastScore IS NULL OR c.lastScore >= 100)) " +
            "ORDER BY b.createdAt ASC")
    List<PendingExamBookmarkProjection> findPending(@Param("userId") String userId);
}
