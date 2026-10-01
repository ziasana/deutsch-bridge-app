package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamTimeBulkUpdateRequest;
import com.deutschbridge.backend.model.dto.ExamTimeSettingsResponse;
import com.deutschbridge.backend.model.dto.ExamTimeUpdateRequest;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.AdminAuditLogService;
import com.deutschbridge.backend.service.ExamTimeConfigurationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Admin management of the recommended time per Teil and the exam-level total duration. */
@RestController
@RequestMapping("/api/admin/exam-time-configurations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamTimeConfigurationController {

    private static final String AUDIT_ACTION = "EXAM_TIME_CONFIGURATION_UPDATED";

    private final ExamTimeConfigurationService service;
    private final AdminAuditLogService adminAuditLogService;
    private final RequestContext requestContext;

    public AdminExamTimeConfigurationController(ExamTimeConfigurationService service,
                                                AdminAuditLogService adminAuditLogService,
                                                RequestContext requestContext) {
        this.service = service;
        this.adminAuditLogService = adminAuditLogService;
        this.requestContext = requestContext;
    }

    @GetMapping
    public ResponseEntity<ExamTimeSettingsResponse> get(@RequestParam LearningLevel level) {
        return ResponseEntity.ok(service.getSettings(level));
    }

    @PutMapping
    public ResponseEntity<ExamTimeSettingsResponse> saveAll(@RequestBody ExamTimeBulkUpdateRequest request) {
        ExamTimeSettingsResponse saved = service.saveSettings(request);
        audit("TELC " + saved.level() + ": saved " + summary(saved));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamTimeSettingsResponse> update(@PathVariable String id,
                                                           @RequestBody ExamTimeUpdateRequest request)
            throws DataNotFoundException {
        ExamTimeSettingsResponse saved = service.update(id, request);
        audit("TELC " + saved.level() + ": updated " + id + " -> " + summary(saved));
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/reset")
    public ResponseEntity<ExamTimeSettingsResponse> reset(@RequestParam LearningLevel level) {
        ExamTimeSettingsResponse saved = service.resetToDefaults(level);
        audit("TELC " + saved.level() + ": reset to defaults");
        return ResponseEntity.ok(saved);
    }

    private void audit(String details) {
        adminAuditLogService.record(requestContext.getUserId(), requestContext.getUserEmail(), AUDIT_ACTION, details);
    }

    private static String summary(ExamTimeSettingsResponse s) {
        return s.configuredMinutes() + " min configured" + (s.totalDurationMinutes() != null ? " of " + s.totalDurationMinutes() : "");
    }
}
