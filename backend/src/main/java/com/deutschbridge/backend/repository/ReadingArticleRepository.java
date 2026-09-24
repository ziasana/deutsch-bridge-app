package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ReadingArticle;
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

    Optional<ReadingArticle> findFirstByLevelAndTopicIgnoreCase(LearningLevel level, String topic);

    Optional<ReadingArticle> findFirstByLevel(LearningLevel level);

    /**
     * One page of a level's list columns only - never selects content/tokens/annotations/quiz.
     * search must already be lower-cased; an empty string matches everything.
     */
    @Query(value = """
            SELECT r.id AS id, r.title AS title, r.topic AS topic, r.level AS level,
                   r.imageUrl AS imageUrl, r.viewCount AS viewCount, r.createdAt AS createdAt
            FROM readingArticles r
            WHERE r.level = :level
              AND (:search = '' OR LOWER(r.title) LIKE CONCAT('%', :search, '%'))
            ORDER BY r.createdAt DESC, r.id ASC
            """,
            countQuery = """
            SELECT COUNT(r) FROM readingArticles r
            WHERE r.level = :level
              AND (:search = '' OR LOWER(r.title) LIKE CONCAT('%', :search, '%'))
            """)
    Page<ReadingArticleListProjection> findListPage(@Param("level") LearningLevel level,
                                                    @Param("search") String search,
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
}
