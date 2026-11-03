package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationAttemptPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSimulationAttemptPartRepository extends JpaRepository<ExamSimulationAttemptPart, String> {

    List<ExamSimulationAttemptPart> findByAttemptIdOrderByPartKeyAscOrdinalAsc(String attemptId);

    /** Only the given parts of an attempt (each carries the whole frozen exercise: texts, questions and answer key). */
    List<ExamSimulationAttemptPart> findByAttemptIdAndPartKeyInOrderByPartKeyAscOrdinalAsc(String attemptId, java.util.Collection<String> partKeys);

    interface QuestionCount {
        String getPartKey();
        Long getTotal();
    }

    /** How many questions each part of an attempt has, counted in SQL so the frozen exercises themselves are not read. */
    @org.springframework.data.jpa.repository.Query("""
            SELECT p.partKey AS partKey,
                   SUM(CASE WHEN function('jsonb_typeof', function('jsonb_extract_path', p.snapshot, 'questions')) = 'array'
                            THEN cast(function('jsonb_array_length', function('jsonb_extract_path', p.snapshot, 'questions')) AS integer) ELSE 0 END) AS total
            FROM ExamSimulationAttemptPart p
            WHERE p.attemptId = :attemptId
            GROUP BY p.partKey
            """)
    List<QuestionCount> questionCounts(@org.springframework.data.repository.query.Param("attemptId") String attemptId);
}
