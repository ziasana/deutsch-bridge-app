package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GrammarLessonRepository extends JpaRepository<GrammarLesson, String> {

    @Query("SELECT DISTINCT g FROM grammarLessons g")
    List<GrammarLesson> getWithLearningProgress();

    boolean existsByTitleIgnoreCase(String title);

    /** A lesson is a duplicate only when title, level and category all match. */
    boolean existsByTitleIgnoreCaseAndLevelAndCategory_Id(String title, LearningLevel level, String categoryId);

    boolean existsByTitleIgnoreCaseAndLevelAndCategoryIsNull(String title, LearningLevel level);

    List<GrammarLesson> findByCategory(GrammarCategory category);

    List<GrammarLesson> findByCategoryAndStatus(GrammarCategory category, GrammarLessonStatus status);

    Optional<GrammarLesson> findByIdAndStatus(String id, GrammarLessonStatus status);

    /**
     * Every lesson with the given status that the learner list shows under one level: lessons in
     * that level's categories, plus uncategorized lessons of that level.
     */
    default List<GrammarLesson> findForLevelView(LearningLevel level, GrammarLessonStatus status) {
        return findForLevelView(level, level, status);
    }

    /**
     * Two level params on purpose: grammar_categories.level is stored as a STRING enum but
     * grammar_lessons.level as an ORDINAL, so one bound parameter can't match both columns.
     */
    @Query("""
            SELECT g FROM grammarLessons g LEFT JOIN FETCH g.category c
            WHERE g.status = :status
              AND ((c IS NOT NULL AND c.level = :categoryLevel) OR (c IS NULL AND g.level = :lessonLevel))
            """)
    List<GrammarLesson> findForLevelView(@Param("categoryLevel") LearningLevel categoryLevel,
                                         @Param("lessonLevel") LearningLevel lessonLevel,
                                         @Param("status") GrammarLessonStatus status);

    @Query("""
            SELECT g.level AS level, COUNT(g) AS total
            FROM grammarLessons g
            WHERE g.status = :status AND g.level IS NOT NULL
            GROUP BY g.level
            """)
    List<LevelCountProjection> countByLevel(@Param("status") GrammarLessonStatus status);

    @Query("""
            SELECT g.level AS level, COUNT(DISTINCT g.id) AS total
            FROM learning_progress lp JOIN lp.lesson g
            WHERE lp.user.id = :userId AND lp.isLearned = true
              AND g.status = :status AND g.level IS NOT NULL
            GROUP BY g.level
            """)
    List<LevelCountProjection> countLearnedByLevelForUser(@Param("userId") String userId,
                                                          @Param("status") GrammarLessonStatus status);

    long countByStatusAndCreatedAtAfter(GrammarLessonStatus status, LocalDateTime after);

    @Modifying
    @Query("UPDATE grammarLessons g SET g.category = null WHERE g.category = :category")
    void unassignCategory(GrammarCategory category);
}
