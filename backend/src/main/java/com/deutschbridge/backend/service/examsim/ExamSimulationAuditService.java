package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamSimulationAudit;
import com.deutschbridge.backend.repository.ExamSimulationAuditRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Writes the append-only audit trail; always joins the caller's transaction so a rolled-back change leaves no trace. */
@Service
public class ExamSimulationAuditService {

    public static final String PROFILE = "PROFILE";
    public static final String ATTEMPT = "ATTEMPT";
    public static final String SYSTEM = "SYSTEM";

    private final ExamSimulationAuditRepository repository;
    private final Clock clock;

    public ExamSimulationAuditService(ExamSimulationAuditRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public void record(String subjectType, String subjectId, String action, String from, String to, String actor, Map<String, Object> details) {
        ExamSimulationAudit audit = new ExamSimulationAudit();
        audit.setSubjectType(subjectType);
        audit.setSubjectId(subjectId);
        audit.setAction(action);
        audit.setFromState(from);
        audit.setToState(to);
        audit.setActor(actor != null ? actor : SYSTEM);
        audit.setDetails(details);
        audit.setOccurredAt(Instant.now(clock));
        repository.save(audit);
    }

    public List<ExamSimulationAudit> trail(String subjectType, String subjectId) {
        return repository.findBySubjectTypeAndSubjectIdOrderByOccurredAtAsc(subjectType, subjectId);
    }
}
