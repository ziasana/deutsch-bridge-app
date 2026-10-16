package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.dto.PublicExamCount;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
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
              AND (:examType IS NULL OR e.examType = :examType)
            """)
    List<ExamExercise> findFiltered(@Param("section") ExamSection section,
                                     @Param("level") LearningLevel level,
                                     @Param("taskType") ExamTaskType taskType,
                                     @Param("examType") ExamType examType);

    /** Published exercises of one exam / level / section: the candidate pool of the full exam simulation. */
    @Query("""
            SELECT e FROM examExercises e
            WHERE e.status = com.deutschbridge.backend.model.enums.ExamContentStatus.PUBLISHED
              AND e.examType = :examType AND e.level = :level AND e.section = :section
            """)
    List<ExamExercise> findPublishedFor(@Param("examType") ExamType examType,
                                        @Param("level") LearningLevel level,
                                        @Param("section") ExamSection section);

    /**
     * Published practice exercises per exam, level and section for the public exam pages. Counts only: no content and no
     * user data. Level-agnostic rows and the informational Testformat section are not practice and are left out.
     */
    @Query("""
            SELECT new com.deutschbridge.backend.model.dto.PublicExamCount(e.examType, e.level, e.section, COUNT(e))
            FROM examExercises e
            WHERE e.status = com.deutschbridge.backend.model.enums.ExamContentStatus.PUBLISHED
              AND e.level IS NOT NULL
              AND e.section <> com.deutschbridge.backend.model.enums.ExamSection.TESTFORMAT_INFORMATION
            GROUP BY e.examType, e.level, e.section
            """)
    List<PublicExamCount> countPublishedByExamLevelSection();

    /** Used to enforce one Testformat Information entry per level (see ExamExerciseService). */
    boolean existsBySectionAndLevel(ExamSection section, LearningLevel level);

    boolean existsBySectionAndLevelAndIdNot(ExamSection section, LearningLevel level, String id);

    long countByPublished(boolean published);

    long countByExamTypeAndSectionAndLevelAndPartNumber(ExamType examType, ExamSection section, LearningLevel level, Integer partNumber);

    /** Candidates for duplicate detection: every exercise of the same section and task type, whatever its level or exam. */
    List<ExamExercise> findBySectionAndTaskType(ExamSection section, ExamTaskType taskType);

    @Query("SELECT e.externalId FROM examExercises e WHERE e.externalId LIKE CONCAT(:prefix, '%')")
    List<String> findExternalIdsStartingWith(@Param("prefix") String prefix);

    /**
     * Per-exam-type and per-level progress for one user, computed entirely in SQL (never loads exercise content)
     * so the level selector's payload stays a handful of rows no matter how large this table
     * grows. Excludes Testformat Information (not practicable/scored) and level-agnostic rows
     * (they don't belong to any one level's aggregate).
     */
    @Query(value = """
            SELECT e.exam_type AS examType,
                   e.level AS level,
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
            GROUP BY e.exam_type, e.level
            ORDER BY e.level
            """, nativeQuery = true)
    List<ExamLevelAggregateProjection> aggregateByLevelForUser(@Param("userId") String userId);
}
