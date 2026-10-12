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
    private final com.deutschbridge.backend.service.OllamaService ollamaService;
    private final com.deutschbridge.backend.repository.ExamSimulationAttemptPartRepository partRepository;
    private final Clock clock;

    public ExamSimulationAdminService(ExamProfileService profileService, ExamPoolService poolService, ExamSimulationAttemptRepository attemptRepository,
                                      ExamSimulationAssessmentRepository assessmentRepository, ExamSimulationAnswerRepository answerRepository,
                                      ExamSimulationService simulationService, ExamSimulationAuditService audit,
                                      com.deutschbridge.backend.service.OllamaService ollamaService,
                                      com.deutschbridge.backend.repository.ExamSimulationAttemptPartRepository partRepository, Clock clock) {
        this.profileService = profileService;
        this.poolService = poolService;
        this.attemptRepository = attemptRepository;
        this.assessmentRepository = assessmentRepository;
        this.answerRepository = answerRepository;
        this.simulationService = simulationService;
        this.audit = audit;
        this.ollamaService = ollamaService;
        this.partRepository = partRepository;
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
                    part.rubricOrEmpty(), text, done,
                    assessmentRepository.findByAttemptIdAndPartKeyAndSource(attempt.getId(), part.key(), AssessmentSource.AI_ESTIMATE)
                            .map(ExamSimulationAssessment::getComment).orElse(null)));
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

    /**
     * Generates an AI feedback text for a written submission to help the assessor. It is stored as an AI_ESTIMATE, carries no
     * points and is never part of a score or pass/fail decision - only the manual assessment counts.
     */
    @Transactional
    public String estimateWriting(String adminId, String attemptId, String partKey) throws DataNotFoundException {
        ExamSimulationAttempt attempt = attemptRepository.findByIdForUpdate(attemptId).orElseThrow(() -> new DataNotFoundException("Exam attempt not found!"));
        if (attempt.getStatus() != SimulationAttemptStatus.COMPLETED && attempt.getStatus() != SimulationAttemptStatus.EXPIRED) {
            throw ExamSimulationException.conflict("ATTEMPT_NOT_FINISHED", "Only finished attempts can be assessed.");
        }
        ExamPartConfig part = attempt.getProfileSnapshot().config().part(partKey);
        if (part == null || part.section() != com.deutschbridge.backend.model.enums.ExamSection.SCHRIFTLICHER_AUSDRUCK) {
            throw ExamSimulationException.badRequest("PART_NOT_WRITING", "AI estimates are only available for writing tasks.");
        }
        String text = answerRepository.findByAttemptId(attemptId).stream()
                .filter(a -> a.getPartKey().equals(partKey) && WRITING_TEXT_ID.equals(a.getQuestionId())).map(ExamSimulationAnswer::getAnswer).findFirst().orElse("");
        if (text == null || text.isBlank()) throw ExamSimulationException.badRequest("NO_SUBMISSION", "There is no text to evaluate.");
        var exercise = partRepository.findByAttemptIdOrderByPartKeyAscOrdinalAsc(attemptId).stream()
                .filter(p -> p.getPartKey().equals(partKey)).findFirst().orElseThrow(() -> new DataNotFoundException("Exercise not found!")).getSnapshot();
        String task = exercise.passagesOrEmpty().stream().map(p -> p.getContent() == null ? "" : p.getContent().replaceAll("<[^>]*>", " ")).reduce("", (x, y) -> x + " " + y).trim();
        String feedback = ollamaService.evaluateWriting(attempt.getProfileSnapshot().level(), task,
                exercise.leitpunkte() != null ? exercise.leitpunkte() : List.of(), text);

        ExamSimulationAssessment estimate = assessmentRepository.findByAttemptIdAndPartKeyAndSource(attemptId, partKey, AssessmentSource.AI_ESTIMATE)
                .orElseGet(() -> {
                    ExamSimulationAssessment created = new ExamSimulationAssessment();
                    created.setAttemptId(attemptId);
                    created.setPartKey(partKey);
                    created.setSource(AssessmentSource.AI_ESTIMATE);
                    return created;
                });
        estimate.setStatus(AssessmentStatus.ASSESSED);
        estimate.setPoints(null);
        estimate.setComment(feedback);
        estimate.setAssessorId("AI");
        estimate.setAssessedAt(Instant.now(clock));
        assessmentRepository.save(estimate);
        audit.record(ExamSimulationAuditService.ATTEMPT, attemptId, "AI_ESTIMATE_CREATED", null, null, adminId, Map.of("partKey", partKey));
        return feedback;
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
