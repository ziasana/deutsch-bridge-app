package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.ExamSimulationException;
import com.deutschbridge.backend.model.dto.examsim.ExamSimulationDtos.*;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.entity.ExamSimulationAnswer;
import com.deutschbridge.backend.model.entity.ExamSimulationAssessment;
import com.deutschbridge.backend.model.entity.ExamSimulationAttempt;
import com.deutschbridge.backend.model.enums.AssessmentSource;
import com.deutschbridge.backend.model.enums.AssessmentStatus;
import com.deutschbridge.backend.model.enums.ExamResultStatus;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.model.examsim.RubricCriterion;
import com.deutschbridge.backend.repository.ExamSimulationAnswerRepository;
import com.deutschbridge.backend.repository.ExamSimulationAssessmentRepository;
import com.deutschbridge.backend.repository.ExamSimulationAttemptRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.deutschbridge.backend.service.examsim.ExamSimulationViewBuilder.WRITING_TEXT_ID;

/** Administrator operations: content availability, attempt inspection and the manual assessment queue. */
@Service
public class ExamSimulationAdminService {

    private static final BigDecimal STEP = new BigDecimal("0.5");

    private final ExamProfileService profileService;
    private final ExamPoolService poolService;
    private final ExamSimulationAttemptRepository attemptRepository;
    private final ExamSimulationAssessmentRepository assessmentRepository;
    private final ExamSimulationAnswerRepository answerRepository;
    private final ExamSimulationService simulationService;
    private final ExamSimulationAuditService audit;
    private final Clock clock;

    public ExamSimulationAdminService(ExamProfileService profileService, ExamPoolService poolService, ExamSimulationAttemptRepository attemptRepository,
                                      ExamSimulationAssessmentRepository assessmentRepository, ExamSimulationAnswerRepository answerRepository,
                                      ExamSimulationService simulationService, ExamSimulationAuditService audit, Clock clock) {
        this.profileService = profileService;
        this.poolService = poolService;
        this.attemptRepository = attemptRepository;
        this.assessmentRepository = assessmentRepository;
        this.answerRepository = answerRepository;
        this.simulationService = simulationService;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse availability(String profileId) throws DataNotFoundException {
        ExamProfile profile = profileService.get(profileId);
        List<ExamPoolService.PartAvailability> parts = poolService.availabilityOverview(profile);
        return new AvailabilityResponse(profileId, parts, parts.stream().allMatch(p -> p.eligible() >= p.required()));
    }

    @Transactional(readOnly = true)
    public List<AdminAttemptRow> attempts(SimulationAttemptStatus status, int limit) {
        return attemptRepository.findAllByStatus(status, PageRequest.of(0, Math.max(1, Math.min(limit, 200)))).stream()
                .map(a -> new AdminAttemptRow(a.getId(), a.getUserId(), a.getProfileCode(), a.getProfileVersion(), a.getStatus(), a.getStartedAt().toEpochMilli(),
                        a.getEndedAt() != null ? a.getEndedAt().toEpochMilli() : null, a.getResult() != null ? a.getResult().overallResult() : null,
                        a.getResult() != null && !a.getResult().pendingAssessmentParts().isEmpty()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentQueueItem> queue() {
        List<AssessmentQueueItem> items = new ArrayList<>();
        for (ExamSimulationAssessment as : assessmentRepository.findByStatusOrderByCreatedAtAsc(AssessmentStatus.AWAITING)) {
            if (as.getSource() != AssessmentSource.MANUAL) continue;
            ExamSimulationAttempt attempt = attemptRepository.findById(as.getAttemptId()).orElse(null);
            if (attempt == null) continue;
            ExamPartConfig part = attempt.getProfileSnapshot().config().part(as.getPartKey());
            if (part == null) continue;
            List<ExamSimulationAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
            String text = answers.stream().filter(a -> a.getPartKey().equals(part.key()) && WRITING_TEXT_ID.equals(a.getQuestionId())).map(ExamSimulationAnswer::getAnswer).findFirst().orElse(null);
            boolean done = answers.stream().anyMatch(a -> a.getPartKey().equals(part.key()) && "true".equals(a.getAnswer()) && ExamSimulationViewBuilder.DONE_ID.equals(a.getQuestionId()));
            items.add(new AssessmentQueueItem(as.getId(), attempt.getId(), attempt.getUserId(), part.key(), part.label(), part.module(),
                    attempt.getEndedAt() != null ? attempt.getEndedAt().toEpochMilli() : attempt.getStartedAt().toEpochMilli(), part.maxPoints(),
                    part.rubricOrEmpty(), text, done));
        }
        return items;
    }

    /**
     * Records the official (MANUAL) assessment of a part and recomputes the attempt result. Re-assessing is allowed and audited.
     * Criterion scores must lie within the rubric and be multiples of 0.5; the part score is their sum.
     */
    @Transactional
    public ExamResult assess(String assessorId, String attemptId, String partKey, AssessmentRequest request) throws DataNotFoundException {
        ExamSimulationAttempt attempt = attemptRepository.findByIdForUpdate(attemptId).orElseThrow(() -> new DataNotFoundException("Exam attempt not found!"));
        if (attempt.getStatus() != SimulationAttemptStatus.COMPLETED && attempt.getStatus() != SimulationAttemptStatus.EXPIRED) {
            throw ExamSimulationException.conflict("ATTEMPT_NOT_FINISHED", "Only finished attempts can be assessed.");
        }
        ExamPartConfig part = attempt.getProfileSnapshot().config().part(partKey);
        if (part == null) throw new DataNotFoundException("Exam part not found!");
        ExamSimulationAssessment assessment = assessmentRepository.findByAttemptIdAndPartKeyAndSource(attemptId, partKey, AssessmentSource.MANUAL)
                .orElseThrow(() -> ExamSimulationException.conflict("PART_NOT_ASSESSABLE", "This part is not manually assessed in this attempt."));

        Map<String, BigDecimal> scores = new LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        Map<String, BigDecimal> given = request != null && request.criteriaScores() != null ? request.criteriaScores() : Map.of();
        for (RubricCriterion c : part.rubricOrEmpty()) {
            BigDecimal value = given.get(c.key());
            if (value == null) throw ExamSimulationException.badRequest("CRITERION_MISSING", "A score for criterion " + c.key() + " is required.");
            if (value.signum() < 0 || value.compareTo(c.maxPoints()) > 0) {
                throw ExamSimulationException.badRequest("CRITERION_OUT_OF_RANGE", "Criterion " + c.key() + " must be between 0 and " + c.maxPoints().stripTrailingZeros().toPlainString() + ".");
            }
            if (value.remainder(STEP).signum() != 0) {
                throw ExamSimulationException.badRequest("CRITERION_STEP_INVALID", "Criterion " + c.key() + " must be a multiple of 0.5.");
            }
            scores.put(c.key(), value);
            total = total.add(value);
        }
        if (given.keySet().stream().anyMatch(k -> part.rubricOrEmpty().stream().noneMatch(c -> c.key().equals(k)))) {
            throw ExamSimulationException.badRequest("CRITERION_UNKNOWN", "Unknown rubric criterion.");
        }
        String before = assessment.getStatus().name();
        assessment.setCriteriaScores(scores);
        assessment.setPoints(total);
        assessment.setComment(request != null ? request.comment() : null);
        assessment.setStatus(AssessmentStatus.ASSESSED);
        assessment.setAssessorId(assessorId);
        assessment.setAssessedAt(Instant.now(clock));
        assessmentRepository.save(assessment);

        attempt.setResult(simulationService.computeResult(attempt));
        attempt.setUpdatedAt(Instant.now(clock));
        attemptRepository.save(attempt);
        audit.record(ExamSimulationAuditService.ATTEMPT, attemptId, "ASSESSED", before, AssessmentStatus.ASSESSED.name(), assessorId,
                Map.of("partKey", partKey, "points", total.toPlainString()));
        return attempt.getResult();
    }

    @Transactional(readOnly = true)
    public List<com.deutschbridge.backend.model.entity.ExamSimulationAudit> auditTrail(String subjectType, String subjectId) {
        return audit.trail(subjectType, subjectId);
    }

    /** Overall status counters for the admin dashboard header. */
    @Transactional(readOnly = true)
    public Map<String, Long> assessmentBacklog() {
        long waiting = assessmentRepository.findByStatusOrderByCreatedAtAsc(AssessmentStatus.AWAITING).stream().filter(a -> a.getSource() == AssessmentSource.MANUAL).count();
        return Map.of("awaitingAssessment", waiting);
    }

    static boolean isPending(ExamResult r) {
        return r != null && (r.overallResult() == ExamResultStatus.AWAITING_ASSESSMENT || !r.pendingAssessmentParts().isEmpty());
    }
}
