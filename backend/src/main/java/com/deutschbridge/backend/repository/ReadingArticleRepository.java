package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.ReadingCategory;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingArticleRepository extends JpaRepository<ReadingArticle, String> {

    List<ReadingArticle> findByLevel(LearningLevel level);

    long countByCreatedAtAfter(LocalDateTime after);

    List<ReadingArticle> findByLinkedGroupId(String linkedGroupId);

    Optional<ReadingArticle> findFirstByLevelAndCategory(LearningLevel level, ReadingCategory category);

    Optional<ReadingArticle> findFirstByLevel(LearningLevel level);

    long countByCategory(ReadingCategory category);

    /**
     * One page of a level's list columns only - never selects content/tokens/annotations/quiz.
     * search must already be lower-cased; an empty string matches everything. categoryId is optional
     * (null matches every category, including uncategorized articles).
     */
    @Query(value = """
            SELECT r.id AS id, r.title AS title, c.id AS categoryId, c.title AS categoryTitle, r.level AS level,
                   r.imageUrl AS imageUrl, r.thumbnailUrl AS thumbnailUrl, r.viewCount AS viewCount, r.createdAt AS createdAt
            FROM readingArticles r
            LEFT JOIN r.category c
            WHERE r.level = :level
              AND (:search = '' OR LOWER(r.title) LIKE CONCAT('%', :search, '%'))
              AND (:categoryId IS NULL OR c.id = :categoryId)
            ORDER BY r.createdAt DESC, r.id ASC
            """,
            countQuery = """
            SELECT COUNT(r) FROM readingArticles r
            LEFT JOIN r.category c
            WHERE r.level = :level
              AND (:search = '' OR LOWER(r.title) LIKE CONCAT('%', :search, '%'))
              AND (:categoryId IS NULL OR c.id = :categoryId)
            """)
    Page<ReadingArticleListProjection> findListPage(@Param("level") LearningLevel level,
                                                    @Param("search") String search,
                                                    @Param("categoryId") String categoryId,
                                                    Pageable pageable);

    /**
     * Same filters as {@link #findListPage}, but restricted to the given user's bookmarked articles -
     * used whenever the "Bookmarked" filter is active, so filtering never happens after pagination.
     * Not cached: it embeds userId and changes as the learner bookmarks/unbookmarks articles.
     */
    @Query(value = """
            SELECT r.id AS id, r.title AS title, c.id AS categoryId, c.title AS categoryTitle, r.level AS level,
                   r.imageUrl AS imageUrl, r.thumbnailUrl AS thumbnailUrl, r.viewCount AS viewCount, r.createdAt AS createdAt
            FROM readingArticles r
            LEFT JOIN r.category c
            JOIN reading_article_bookmarks b ON b.article = r AND b.user.id = :userId
            WHERE r.level = :level
              AND (:search = '' OR LOWER(r.title) LIKE CONCAT('%', :search, '%'))
              AND (:categoryId IS NULL OR c.id = :categoryId)
            ORDER BY r.createdAt DESC, r.id ASC
            """,
            countQuery = """
            SELECT COUNT(r) FROM readingArticles r
            LEFT JOIN r.category c
            JOIN reading_article_bookmarks b ON b.article = r AND b.user.id = :userId
            WHERE r.level = :level
              AND (:search = '' OR LOWER(r.title) LIKE CONCAT('%', :search, '%'))
              AND (:categoryId IS NULL OR c.id = :categoryId)
            """)
    Page<ReadingArticleListProjection> findBookmarkedListPageForUser(@Param("level") LearningLevel level,
                                                                      @Param("search") String search,
                                                                      @Param("categoryId") String categoryId,
                                                                      @Param("userId") String userId,
                                                                      Pageable pageable);

    /** Just the annotation lemmas of the given articles (for per-user new-word counts), unpacked in SQL. */
    @Query(value = """
            SELECT r.id AS articleId, a ->> 'lemma' AS lemma
            FROM reading_articles r
            CROSS JOIN LATERAL jsonb_array_elements(
                CASE WHEN jsonb_typeof(r.annotations) = 'array' THEN r.annotations ELSE CAST('[]' AS jsonb) END
            ) AS a
            WHERE r.id IN (:ids)
            """, nativeQuery = true)
    List<ReadingArticleLemmaProjection> findAnnotationLemmas(@Param("ids") Collection<String> ids);

    @Query("""
            SELECT r.level AS level, COUNT(r) AS total
            FROM readingArticles r
            WHERE r.level IS NOT NULL
            GROUP BY r.level
            """)
    List<LevelCountProjection> countByLevel();

    @Query("""
            SELECT r.level AS level, COUNT(DISTINCT r.id) AS total
            FROM learning_progress lp JOIN lp.reading r
            WHERE lp.user.id = :userId AND lp.isLearned = true AND r.level IS NOT NULL
            GROUP BY r.level
            """)
    List<LevelCountProjection> countLearnedByLevelForUser(@Param("userId") String userId);

    /** Atomic counter bump - avoids loading and re-saving the whole article (and its jsonb columns) per view. */
    @Modifying
    @Query("UPDATE readingArticles r SET r.viewCount = r.viewCount + 1 WHERE r.id = :id")
    int incrementViewCount(@Param("id") String id);

    @Query("SELECT r.viewCount FROM readingArticles r WHERE r.id = :id")
    Optional<Long> findViewCountById(@Param("id") String id);

    /**
     * The article right after this one in the level's list order (see {@link #findListPage}'s
     * ORDER BY createdAt DESC, id ASC) - i.e. the next older article, tie-broken by a larger id.
     * Pass a single-row Pageable; empty when this is the last article in the level.
     */
    @Query("""
            SELECT r.id AS id, r.title AS title
            FROM readingArticles r
            WHERE r.level = :level
              AND (r.createdAt < :createdAt OR (r.createdAt = :createdAt AND r.id > :id))
            ORDER BY r.createdAt DESC, r.id ASC
            """)
    List<ReadingArticleNeighborProjection> findNextInLevel(@Param("level") LearningLevel level,
                                                            @Param("createdAt") LocalDateTime createdAt,
                                                            @Param("id") String id,
                                                            Pageable pageable);

    /** Mirror of {@link #findNextInLevel} - the previous (next newer) article in the same order. */
    @Query("""
            SELECT r.id AS id, r.title AS title
            FROM readingArticles r
            WHERE r.level = :level
              AND (r.createdAt > :createdAt OR (r.createdAt = :createdAt AND r.id < :id))
            ORDER BY r.createdAt ASC, r.id DESC
            """)
    List<ReadingArticleNeighborProjection> findPreviousInLevel(@Param("level") LearningLevel level,
                                                                @Param("createdAt") LocalDateTime createdAt,
                                                                @Param("id") String id,
                                                                Pageable pageable);
}
