package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.ReadingArticleBookmark;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ReadingArticleBookmarkRepository extends JpaRepository<ReadingArticleBookmark, String> {

    boolean existsByUserAndArticle(User user, ReadingArticle article);

    @Transactional
    void deleteByUserAndArticle(User user, ReadingArticle article);

    @Transactional
    void deleteByArticle(ReadingArticle article);

    /** For merging bookmark state onto a page of light list DTOs. */
    List<ReadingArticleBookmark> findByUserAndArticle_IdIn(User user, java.util.Collection<String> articleIds);

    /**
     * The user's bookmarked articles they haven't learned yet, oldest bookmark first - the "saved for
     * later" to-do list, across every level.
     */
    @Query("SELECT a.id AS id, a.title AS title, a.level AS level, b.createdAt AS bookmarkedAt " +
            "FROM reading_article_bookmarks b JOIN b.article a " +
            "WHERE b.user = :user AND NOT EXISTS (" +
            "SELECT 1 FROM learning_progress p WHERE p.user = :user AND p.reading = a AND p.isLearned = true) " +
            "ORDER BY b.createdAt ASC")
    List<PendingReadingBookmarkProjection> findPending(@Param("user") User user);
}
