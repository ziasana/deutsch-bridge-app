package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserWordProgressRepository extends JpaRepository<UserWordProgress, String> {

    Optional<UserWordProgress> findByUserAndLemma(User user, String lemma);

    List<UserWordProgress> findByUserAndLemmaIn(User user, List<String> lemmas);

    List<UserWordProgress> findByUser(User user);

    /**
     * The flashcards that are due: not KNOWN yet and never scheduled or scheduled up to {@code now}, longest-waiting first (never
     * scheduled ones first). Filtered and sorted in SQL, so a learner with a large lexicon does not load every word to see a few cards.
     */
    @Query("""
            SELECT p FROM user_word_progress p
            WHERE p.user = :user AND p.status <> com.deutschbridge.backend.model.enums.WordProgressStatus.KNOWN
              AND (p.srsDueAt IS NULL OR p.srsDueAt <= :now)
            ORDER BY p.srsDueAt ASC NULLS FIRST
            """)
    List<UserWordProgress> findDueForReview(@Param("user") User user, @Param("now") java.time.LocalDateTime now);
}
