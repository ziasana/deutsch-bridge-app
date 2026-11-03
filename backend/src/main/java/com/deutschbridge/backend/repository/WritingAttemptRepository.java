package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.WritingAttempt;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WritingAttemptRepository extends JpaRepository<WritingAttempt, String> {

    List<WritingAttempt> findByUserIdAndExerciseIdOrderByAttemptNumberAsc(String userId, String exerciseId);

    List<WritingAttempt> findByUserIdOrderBySubmittedAtDesc(String userId);

    /** The newest attempts only (pass a PageRequest) - the full rows carry the texts and the stored feedback. */
    List<WritingAttempt> findByUserIdOrderBySubmittedAtDesc(String userId, Pageable pageable);

    /** Totals over all of a learner's attempts, computed in the database so no text or feedback is loaded. */
    @Query("""
            SELECT COUNT(a) AS attempts,
                   COUNT(DISTINCT a.exerciseId) AS exercises,
                   COALESCE(SUM(CASE WHEN a.parentAttemptId IS NOT NULL THEN 1 ELSE 0 END), 0) AS revisions,
                   COALESCE(SUM(a.wordCount), 0) AS words,
                   MAX(a.submittedAt) AS lastSubmittedAt
            FROM writingAttempts a
            WHERE a.userId = :userId
            """)
    WritingTotals totalsForUser(@Param("userId") String userId);

    interface WritingTotals {
        long getAttempts();
        long getExercises();
        long getRevisions();
        long getWords();
        java.time.LocalDateTime getLastSubmittedAt();
    }

    int countByUserIdAndExerciseId(String userId, String exerciseId);
}
