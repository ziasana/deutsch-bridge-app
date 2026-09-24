package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface ExpressionRepository extends JpaRepository<Expression, String> {

    long countByStatus(ExpressionStatus status);

    long countByStatusAndCreatedAtAfter(ExpressionStatus status, LocalDateTime after);

    /** Published-count per type, for the collection-summary cards - no expression rows loaded. */
    @Query("""
            SELECT e.type AS type, COUNT(e) AS total
            FROM expressions e
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
            GROUP BY e.type
            """)
    List<ExpressionTypeCountProjection> countPublishedByType();

    /**
     * One page of a type's list columns only - never selects examples/patterns/questions.
     * search must already be lower-cased; an empty string matches everything. level=null matches
     * every level.
     */
    @Query(value = """
            SELECT e.id AS id, e.expression AS expression, e.level AS level, e.meaningDe AS meaningDe,
                   e.meaningEn AS meaningEn, e.register AS register, e.imageUrl AS imageUrl, e.createdAt AS createdAt
            FROM expressions e
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
              AND e.type = :type
              AND (:level IS NULL OR e.level = :level)
              AND (:search = '' OR LOWER(e.expression) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningDe) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningEn) LIKE CONCAT('%', :search, '%'))
            ORDER BY e.createdAt DESC, e.id ASC
            """,
            countQuery = """
            SELECT COUNT(e) FROM expressions e
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
              AND e.type = :type
              AND (:level IS NULL OR e.level = :level)
              AND (:search = '' OR LOWER(e.expression) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningDe) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningEn) LIKE CONCAT('%', :search, '%'))
            """)
    // Fixed order (this is the cached path - see ContentCacheService.getExpressionListPage): any
    // other sort (alphabetical/progress) or personal filter (mastery/bookmark) is served by
    // findListPageForUser(...)/findListPageForUserByProgress(...) instead, never by re-sorting a
    // page already fetched in this order.
    Page<ExpressionListProjection> findListPage(@Param("type") ExpressionType type,
                                                 @Param("level") LearningLevel level,
                                                 @Param("search") String search,
                                                 Pageable pageable);

    /** One example sentence per expression id (first by id), for the shared cached list's preview snippet. */
    @Query(value = """
            SELECT DISTINCT ON (ex.expression_id) ex.expression_id AS expressionId, ex.sentence AS sentence
            FROM expression_examples ex
            WHERE ex.expression_id IN (:ids)
            ORDER BY ex.expression_id, ex.id
            """, nativeQuery = true)
    List<ExpressionExampleSentenceProjection> findFirstExampleSentences(@Param("ids") Collection<String> ids);

    /**
     * Same filters as {@link #findListPage}, plus the current user's live mastery/overall-score/
     * bookmark state and optional filtering on them - used whenever a progress or bookmark filter
     * is active, so filtering never happens after pagination. Not cached: it embeds userId and
     * changes as the learner practices.
     */
    @Query(value = """
            SELECT e.id AS id, e.expression AS expression, e.level AS level, e.meaningDe AS meaningDe,
                   e.meaningEn AS meaningEn, e.register AS register, e.imageUrl AS imageUrl, e.createdAt AS createdAt,
                   COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW) AS masteryLevel,
                   (COALESCE(p.recognitionScore,0)*0.20 + COALESCE(p.recallScore,0)*0.25 + COALESCE(p.contextScore,0)*0.15
                     + COALESCE(p.transformationScore,0)*0.15 + COALESCE(p.productionScore,0)*0.25) AS overallScore,
                   COALESCE(p.productionScore,0) AS productionScore,
                   (CASE WHEN b.id IS NOT NULL THEN true ELSE false END) AS bookmarked
            FROM expressions e
            LEFT JOIN expression_progress p ON p.expression = e AND p.user.id = :userId
            LEFT JOIN expression_bookmarks b ON b.expression = e AND b.user.id = :userId
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
              AND e.type = :type
              AND (:level IS NULL OR e.level = :level)
              AND (:search = '' OR LOWER(e.expression) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningDe) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningEn) LIKE CONCAT('%', :search, '%'))
              AND (:masteryLevel IS NULL OR COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW) = :masteryLevel)
              AND (:bookmarkedOnly = false OR b.id IS NOT NULL)
            """,
            countQuery = """
            SELECT COUNT(e) FROM expressions e
            LEFT JOIN expression_progress p ON p.expression = e AND p.user.id = :userId
            LEFT JOIN expression_bookmarks b ON b.expression = e AND b.user.id = :userId
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
              AND e.type = :type
              AND (:level IS NULL OR e.level = :level)
              AND (:search = '' OR LOWER(e.expression) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningDe) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningEn) LIKE CONCAT('%', :search, '%'))
              AND (:masteryLevel IS NULL OR COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW) = :masteryLevel)
              AND (:bookmarkedOnly = false OR b.id IS NOT NULL)
            """)
    // No ORDER BY here either - see the note on findListPage; the RECOMMENDED/ALPHABETICAL sorts
    // both go through this method with an explicit Pageable Sort.
    Page<ExpressionListForUserProjection> findListPageForUser(@Param("type") ExpressionType type,
                                                                @Param("level") LearningLevel level,
                                                                @Param("search") String search,
                                                                @Param("masteryLevel") ExpressionMasteryLevel masteryLevel,
                                                                @Param("bookmarkedOnly") boolean bookmarkedOnly,
                                                                @Param("userId") String userId,
                                                                Pageable pageable);

    /** Same as {@link #findListPageForUser} but ordered by the user's overall score, best first - for sort=progress. */
    @Query(value = """
            SELECT e.id AS id, e.expression AS expression, e.level AS level, e.meaningDe AS meaningDe,
                   e.meaningEn AS meaningEn, e.register AS register, e.imageUrl AS imageUrl, e.createdAt AS createdAt,
                   COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW) AS masteryLevel,
                   (COALESCE(p.recognitionScore,0)*0.20 + COALESCE(p.recallScore,0)*0.25 + COALESCE(p.contextScore,0)*0.15
                     + COALESCE(p.transformationScore,0)*0.15 + COALESCE(p.productionScore,0)*0.25) AS overallScore,
                   COALESCE(p.productionScore,0) AS productionScore,
                   (CASE WHEN b.id IS NOT NULL THEN true ELSE false END) AS bookmarked
            FROM expressions e
            LEFT JOIN expression_progress p ON p.expression = e AND p.user.id = :userId
            LEFT JOIN expression_bookmarks b ON b.expression = e AND b.user.id = :userId
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
              AND e.type = :type
              AND (:level IS NULL OR e.level = :level)
              AND (:search = '' OR LOWER(e.expression) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningDe) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningEn) LIKE CONCAT('%', :search, '%'))
              AND (:masteryLevel IS NULL OR COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW) = :masteryLevel)
              AND (:bookmarkedOnly = false OR b.id IS NOT NULL)
            ORDER BY (COALESCE(p.recognitionScore,0)*0.20 + COALESCE(p.recallScore,0)*0.25 + COALESCE(p.contextScore,0)*0.15
                     + COALESCE(p.transformationScore,0)*0.15 + COALESCE(p.productionScore,0)*0.25) DESC, e.id ASC
            """,
            countQuery = """
            SELECT COUNT(e) FROM expressions e
            LEFT JOIN expression_progress p ON p.expression = e AND p.user.id = :userId
            LEFT JOIN expression_bookmarks b ON b.expression = e AND b.user.id = :userId
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
              AND e.type = :type
              AND (:level IS NULL OR e.level = :level)
              AND (:search = '' OR LOWER(e.expression) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningDe) LIKE CONCAT('%', :search, '%')
                   OR LOWER(e.meaningEn) LIKE CONCAT('%', :search, '%'))
              AND (:masteryLevel IS NULL OR COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW) = :masteryLevel)
              AND (:bookmarkedOnly = false OR b.id IS NOT NULL)
            """)
    Page<ExpressionListForUserProjection> findListPageForUserByProgress(@Param("type") ExpressionType type,
                                                                          @Param("level") LearningLevel level,
                                                                          @Param("search") String search,
                                                                          @Param("masteryLevel") ExpressionMasteryLevel masteryLevel,
                                                                          @Param("bookmarkedOnly") boolean bookmarkedOnly,
                                                                          @Param("userId") String userId,
                                                                          Pageable pageable);

    /**
     * Top of a type's non-mastered expressions for the current user, ordered the same way the
     * "Continue learning" section always has: weakest mastery stage first (LEARNING, FAMILIAR,
     * ACTIVE, then never-started NEW), then lowest overall score - never derived from the general
     * paginated list.
     */
    @Query("""
            SELECT e.id AS id, e.expression AS expression, e.level AS level, e.meaningDe AS meaningDe,
                   e.meaningEn AS meaningEn, e.register AS register, e.imageUrl AS imageUrl, e.createdAt AS createdAt,
                   COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW) AS masteryLevel,
                   (COALESCE(p.recognitionScore,0)*0.20 + COALESCE(p.recallScore,0)*0.25 + COALESCE(p.contextScore,0)*0.15
                     + COALESCE(p.transformationScore,0)*0.15 + COALESCE(p.productionScore,0)*0.25) AS overallScore,
                   COALESCE(p.productionScore,0) AS productionScore,
                   (CASE WHEN b.id IS NOT NULL THEN true ELSE false END) AS bookmarked
            FROM expressions e
            LEFT JOIN expression_progress p ON p.expression = e AND p.user.id = :userId
            LEFT JOIN expression_bookmarks b ON b.expression = e AND b.user.id = :userId
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
              AND e.type = :type
              AND COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW)
                  <> com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.MASTERED
            ORDER BY (CASE COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW)
                        WHEN com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.LEARNING THEN 0
                        WHEN com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.FAMILIAR THEN 1
                        WHEN com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.ACTIVE THEN 2
                        ELSE 3 END),
                     (COALESCE(p.recognitionScore,0)*0.20 + COALESCE(p.recallScore,0)*0.25 + COALESCE(p.contextScore,0)*0.15
                     + COALESCE(p.transformationScore,0)*0.15 + COALESCE(p.productionScore,0)*0.25) ASC
            """)
    List<ExpressionListForUserProjection> findContinueLearningForUser(@Param("type") ExpressionType type,
                                                                        @Param("userId") String userId,
                                                                        Pageable pageable);

    @Query("""
            SELECT COUNT(e) FROM expressions e
            LEFT JOIN expression_progress p ON p.expression = e AND p.user.id = :userId
            WHERE e.status = com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED
              AND e.type = :type
              AND COALESCE(p.masteryLevel, com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.NEW)
                  <> com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.MASTERED
            """)
    long countReadyForUser(@Param("type") ExpressionType type, @Param("userId") String userId);
}
