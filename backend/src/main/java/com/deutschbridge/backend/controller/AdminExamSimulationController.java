package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.examsim.ExamProfileRequest;
import com.deutschbridge.backend.model.dto.examsim.ExamProfileResponse;
import com.deutschbridge.backend.model.dto.examsim.ExamSimulationDtos.*;
import com.deutschbridge.backend.model.dto.examsim.PublishProfileRequest;
import com.deutschbridge.backend.model.entity.ExamSimulationAudit;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.service.examsim.ExamProfileService;
import com.deutschbridge.backend.service.examsim.ExamSimulationAdminService;
import com.deutschbridge.backend.service.examsim.ExamSimulationAuditService;
import com.deutschbridge.backend.service.examsim.ProfileValidationResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Exam Simulation Management. Secured by the /api/admin/** rule (ROLE_ADMIN) in SecurityConfig. */
@RestController
@RequestMapping("/api/admin/exam-simulation")
public class AdminExamSimulationController {

    private final ExamProfileService profileService;
    private final ExamSimulationAdminService adminService;
    private final RequestContext requestContext;

    public AdminExamSimulationController(ExamProfileService profileService, ExamSimulationAdminService adminService, RequestContext requestContext) {
        this.profileService = profileService;
        this.adminService = adminService;
        this.requestContext = requestContext;
    }

    @GetMapping("/profiles")
    public ResponseEntity<List<ExamProfileResponse>> list() {
        return ResponseEntity.ok(profileService.listAll().stream().map(ExamProfileResponse::of).toList());
    }

    @GetMapping("/profiles/{id}")
    public ResponseEntity<ExamProfileResponse> get(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(ExamProfileResponse.of(profileService.get(id)));
    }

    @PostMapping("/profiles")
    public ResponseEntity<ExamProfileResponse> create(@RequestBody ExamProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ExamProfileResponse.of(profileService.create(request, requestContext.getUserId())));
    }

    @PutMapping("/profiles/{id}")
    public ResponseEntity<ExamProfileResponse> update(@PathVariable String id, @RequestBody ExamProfileRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(ExamProfileResponse.of(profileService.update(id, request, requestContext.getUserId())));
    }

    @PostMapping("/profiles/{id}/duplicate")
    public ResponseEntity<ExamProfileResponse> duplicate(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.status(HttpStatus.CREATED).body(ExamProfileResponse.of(profileService.duplicate(id, requestContext.getUserId())));
    }

    @PostMapping("/profiles/{id}/validate")
    public ResponseEntity<ValidationResponse> validate(@PathVariable String id) throws DataNotFoundException {
        ProfileValidationResult r = profileService.validate(id);
        return ResponseEntity.ok(new ValidationResponse(r.isValid(), r.errors(), r.warnings()));
    }

    @PostMapping("/profiles/{id}/publish")
    public ResponseEntity<ExamProfileResponse> publish(@PathVariable String id, @RequestBody(required = false) PublishProfileRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(ExamProfileResponse.of(profileService.publish(id, request != null ? request.verificationNote() : null, request != null && request.acceptContentGaps(), requestContext.getUserId())));
    }

    @PostMapping("/profiles/{id}/deactivate")
    public ResponseEntity<ExamProfileResponse> deactivate(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(ExamProfileResponse.of(profileService.deactivate(id, requestContext.getUserId())));
    }

    @PostMapping("/profiles/{id}/archive")
    public ResponseEntity<ExamProfileResponse> archive(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(ExamProfileResponse.of(profileService.archive(id, requestContext.getUserId())));
    }

    @GetMapping("/profiles/{id}/availability")
    public ResponseEntity<AvailabilityResponse> availability(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(adminService.availability(id));
    }

    @GetMapping("/profiles/{id}/audit")
    public ResponseEntity<List<ExamSimulationAudit>> profileAudit(@PathVariable String id) {
        return ResponseEntity.ok(adminService.auditTrail(ExamSimulationAuditService.PROFILE, id));
    }

    @GetMapping("/attempts")
    public ResponseEntity<List<AdminAttemptRow>> attempts(@RequestParam(required = false) SimulationAttemptStatus status,
                                                          @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(adminService.attempts(status, limit));
    }

    @GetMapping("/attempts/{attemptId}/audit")
    public ResponseEntity<List<ExamSimulationAudit>> attemptAudit(@PathVariable String attemptId) {
        return ResponseEntity.ok(adminService.auditTrail(ExamSimulationAuditService.ATTEMPT, attemptId));
    }

    @GetMapping("/assessments/queue")
    public ResponseEntity<List<AssessmentQueueItem>> queue() {
        return ResponseEntity.ok(adminService.queue());
    }

    @GetMapping("/assessments/backlog")
    public ResponseEntity<Map<String, Long>> backlog() {
        return ResponseEntity.ok(adminService.assessmentBacklog());
    }

    /** AI feedback for the assessor; stored separately and never counted into any score. */
    @PostMapping("/attempts/{attemptId}/parts/{partKey}/ai-estimate")
    public ResponseEntity<Map<String, String>> aiEstimate(@PathVariable String attemptId, @PathVariable String partKey) throws DataNotFoundException {
        return ResponseEntity.ok(Map.of("feedback", adminService.estimateWriting(requestContext.getUserId(), attemptId, partKey), "official", "false"));
    }

    @PutMapping("/attempts/{attemptId}/parts/{partKey}/assessment")
    public ResponseEntity<ExamResult> assess(@PathVariable String attemptId, @PathVariable String partKey, @RequestBody AssessmentRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(adminService.assess(requestContext.getUserId(), attemptId, partKey, request));
    }
}
