package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.EmailConfigResponse;
import com.deutschbridge.backend.model.dto.EmailSendLogResponse;
import com.deutschbridge.backend.model.dto.EmailTestRequest;
import com.deutschbridge.backend.service.AdminAuditLogService;
import com.deutschbridge.backend.service.AdminEmailTestService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin tool to verify outgoing email works and to see exactly why a send failed. */
@RestController
@RequestMapping("/api/admin/settings/email-test")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmailTestController {

    private final AdminEmailTestService emailTestService;
    private final AdminAuditLogService adminAuditLogService;
    private final RequestContext requestContext;

    public AdminEmailTestController(AdminEmailTestService emailTestService,
                                    AdminAuditLogService adminAuditLogService,
                                    RequestContext requestContext) {
        this.emailTestService = emailTestService;
        this.adminAuditLogService = adminAuditLogService;
        this.requestContext = requestContext;
    }

    @GetMapping("/config")
    public EmailConfigResponse getConfig() {
        return emailTestService.config();
    }

    @GetMapping("/logs")
    public List<EmailSendLogResponse> getLogs() {
        return emailTestService.findRecent().stream().map(EmailSendLogResponse::fromEntity).toList();
    }

    /** Returns 200 with the outcome even when delivery failed; the failure is data, not an HTTP error. */
    @PostMapping
    public EmailSendLogResponse send(@RequestBody @Valid EmailTestRequest request) {
        var entry = emailTestService.send(request.recipientEmail(), request.type(), requestContext.getUserEmail());
        adminAuditLogService.record(
                requestContext.getUserId(),
                requestContext.getUserEmail(),
                "TEST_EMAIL_SENT",
                request.type() + " to " + entry.getRecipientEmail() + ": " + entry.getStatus()
                        + (entry.getErrorCategory() == null ? "" : " (" + entry.getErrorCategory() + ")")
        );
        return EmailSendLogResponse.fromEntity(entry);
    }
}
