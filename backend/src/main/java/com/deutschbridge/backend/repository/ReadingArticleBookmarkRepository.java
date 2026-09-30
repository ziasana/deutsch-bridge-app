package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.ReadingArticleBookmark;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
