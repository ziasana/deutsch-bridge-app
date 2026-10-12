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

    List<ExamSimulationAttempt> findByUserIdAndProfileCodeOrderByStartedAtDesc(String userId, String profileCode);

    @Query("SELECT a.id FROM ExamSimulationAttempt a WHERE a.status = com.deutschbridge.backend.model.enums.SimulationAttemptStatus.IN_PROGRESS AND a.finalDeadlineAt < :now")
    List<String> findOverdueIds(@Param("now") Instant now);

    @Query("SELECT a FROM ExamSimulationAttempt a WHERE (:status IS NULL OR a.status = :status) ORDER BY a.startedAt DESC")
    List<ExamSimulationAttempt> findAllByStatus(@Param("status") SimulationAttemptStatus status, Pageable pageable);

    long countByProfileId(String profileId);
}
