package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamExerciseRepository extends JpaRepository<ExamExercise, String> {

    /**
     * A null level always matches (level-agnostic entries like Testformat Information apply to
     * every level), matching how the frontend interprets a null level everywhere else.
     */
    @Query("""
            SELECT e FROM examExercises e
            WHERE (:section IS NULL OR e.section = :section)
              AND (:level IS NULL OR e.level = :level OR e.level IS NULL)
              AND (:taskType IS NULL OR e.taskType = :taskType)
            """)
    List<ExamExercise> findFiltered(@Param("section") ExamSection section,
                                     @Param("level") LearningLevel level,
                                     @Param("taskType") ExamTaskType taskType);

    /** Used to enforce one Testformat Information entry per level (see ExamExerciseService). */
    boolean existsBySectionAndLevel(ExamSection section, LearningLevel level);

    boolean existsBySectionAndLevelAndIdNot(ExamSection section, LearningLevel level, String id);

    /**
     * Per-level progress for one user, computed entirely in SQL (never loads exercise content)
     * so the level selector's payload stays a handful of rows no matter how large this table
     * grows. Excludes Testformat Information (not practicable/scored) and level-agnostic rows
     * (they don't belong to any one level's aggregate).
     */
    @Query(value = """
            SELECT e.level AS level,
                   COUNT(*) AS total,
                   COUNT(*) FILTER (
                       WHERE COALESCE(c.last_score, CASE WHEN c.id IS NOT NULL THEN 100 ELSE 0 END) = 100
                   ) AS mastered,
                   AVG(COALESCE(c.last_score, CASE WHEN c.id IS NOT NULL THEN 100 ELSE 0 END)) AS avgScore
            FROM exam_exercises e
            LEFT JOIN exam_exercise_completions c
                   ON c.exercise_id = e.id AND c.user_id = :userId
            WHERE e.published = true
              AND e.section <> 'TESTFORMAT_INFORMATION'
              AND e.level IS NOT NULL
            GROUP BY e.level
            ORDER BY e.level
            """, nativeQuery = true)
    List<ExamLevelAggregateProjection> aggregateByLevelForUser(@Param("userId") String userId);
}
