package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingArticleRepository extends JpaRepository<ReadingArticle, String> {

    List<ReadingArticle> findByLevel(LearningLevel level);

    List<ReadingArticle> findByLinkedGroupId(String linkedGroupId);

    Optional<ReadingArticle> findFirstByLevelAndTopicIgnoreCase(LearningLevel level, String topic);

    Optional<ReadingArticle> findFirstByLevel(LearningLevel level);
}
