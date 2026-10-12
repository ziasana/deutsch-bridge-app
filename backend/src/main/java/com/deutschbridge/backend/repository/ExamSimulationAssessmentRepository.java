package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationAssessment;
import com.deutschbridge.backend.model.enums.AssessmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSimulationAssessmentRepository extends JpaRepository<ExamSimulationAssessment, String> {

    List<ExamSimulationAssessment> findByAttemptId(String attemptId);

    Optional<ExamSimulationAssessment> findByAttemptIdAndPartKeyAndSource(String attemptId, String partKey,
                                                                          com.deutschbridge.backend.model.enums.AssessmentSource source);

    List<ExamSimulationAssessment> findByStatusOrderByCreatedAtAsc(AssessmentStatus status);
}
