package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationAttempt;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSimulationAttemptRepository extends JpaRepository<ExamSimulationAttempt, String> {

    Optional<ExamSimulationAttempt> findByIdAndUserId(String id, String userId);

    /** Row lock used by every state-changing operation, which serialises save/complete/submit/expire on one attempt. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM ExamSimulationAttempt a WHERE a.id = :id")
    Optional<ExamSimulationAttempt> findByIdForUpdate(@Param("id") String id);

    Optional<ExamSimulationAttempt> findFirstByUserIdAndProfileCodeAndStatus(String userId, String profileCode, SimulationAttemptStatus status);

    List<ExamSimulationAttempt> findByUserIdOrderByStartedAtDesc(String userId);

    /**
     * One attempt as the overview and the history need it. The full row also carries the whole frozen profile (every part, timer and rubric)
     * and the stage states; this reads the few scalars, the result and three values pulled out of the snapshot in SQL instead.
     */
    interface AttemptRow {
        String getId();
        String getSetId();
        String getProfileCode();
        int getProfileVersion();
        SimulationAttemptStatus getStatus();
        Instant getStartedAt();
        Instant getEndedAt();
        Instant getFinalDeadlineAt();
        Instant getPausedAt();
        com.deutschbridge.backend.model.examsim.ExamResult getResult();
        String getTitle();
        String getWrittenMaxText();
        String getOralMaxText();
    }

    @Query("""
            SELECT a.id AS id, a.setId AS setId, a.profileCode AS profileCode, a.profileVersion AS profileVersion, a.status AS status,
                   a.startedAt AS startedAt, a.endedAt AS endedAt, a.finalDeadlineAt AS finalDeadlineAt, a.pausedAt AS pausedAt, a.result AS result,
                   function('jsonb_extract_path_text', a.profileSnapshot, 'title') AS title,
                   function('jsonb_extract_path_text', a.profileSnapshot, 'writtenMaxPoints') AS writtenMaxText,
                   function('jsonb_extract_path_text', a.profileSnapshot, 'oralMaxPoints') AS oralMaxText
            FROM ExamSimulationAttempt a
            WHERE a.userId = :userId
            ORDER BY a.startedAt DESC
            """)
    List<AttemptRow> findRowsByUser(@Param("userId") String userId);

    List<ExamSimulationAttempt> findByUserIdAndProfileCodeOrderByStartedAtDesc(String userId, String profileCode);

    @Query("SELECT a.id FROM ExamSimulationAttempt a WHERE a.status = com.deutschbridge.backend.model.enums.SimulationAttemptStatus.IN_PROGRESS AND a.finalDeadlineAt < :now")
    List<String> findOverdueIds(@Param("now") Instant now);

    @Query("SELECT a FROM ExamSimulationAttempt a WHERE (:status IS NULL OR a.status = :status) ORDER BY a.startedAt DESC")
    List<ExamSimulationAttempt> findAllByStatus(@Param("status") SimulationAttemptStatus status, Pageable pageable);

    long countByProfileId(String profileId);

    List<ExamSimulationAttempt> findByUserIdAndSetIdIn(String userId, java.util.Collection<String> setIds);

    boolean existsByUserIdAndSetId(String userId, String setId);

    /** The learner's latest attempt on one exam of a profile - decides whether it may be taken again. */
    Optional<ExamSimulationAttempt> findFirstByUserIdAndSetIdOrderByStartedAtDesc(String userId, String setId);
}
