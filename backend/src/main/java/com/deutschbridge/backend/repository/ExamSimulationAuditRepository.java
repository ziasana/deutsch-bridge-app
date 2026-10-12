package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSimulationAuditRepository extends JpaRepository<ExamSimulationAudit, String> {

    List<ExamSimulationAudit> findBySubjectTypeAndSubjectIdOrderByOccurredAtAsc(String subjectType, String subjectId);
}
