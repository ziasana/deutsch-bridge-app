package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationAttemptPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSimulationAttemptPartRepository extends JpaRepository<ExamSimulationAttemptPart, String> {

    List<ExamSimulationAttemptPart> findByAttemptIdOrderByPartKeyAscOrdinalAsc(String attemptId);
}
