package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.entity.VocabularyProgress;
import com.deutschbridge.backend.model.enums.VocabularyMasteryLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyProgressRepository extends JpaRepository<VocabularyProgress, String> {

    Optional<VocabularyProgress> findByUserAndVocabularyItem(User user, VocabularyItem vocabularyItem);

    List<VocabularyProgress> findByUser(User user);

    List<VocabularyProgress> findByUserAndVocabularyItemIn(User user, List<VocabularyItem> vocabularyItems);

    long countByUserAndMasteryLevel(User user, VocabularyMasteryLevel masteryLevel);

    /** Same "due" rule as the dashboard: not yet mastered and never scheduled or scheduled for now/past. */
    @Query("SELECT COUNT(p) FROM vocabulary_progress p WHERE p.user = :user " +
            "AND p.masteryLevel <> com.deutschbridge.backend.model.enums.VocabularyMasteryLevel.MASTERED " +
            "AND (p.nextReviewAt IS NULL OR p.nextReviewAt <= :now)")
    long countDueForReview(@Param("user") User user, @Param("now") LocalDateTime now);
}
