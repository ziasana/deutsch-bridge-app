package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.EmailSendLog;

import java.time.Instant;

public record EmailSendLogResponse(
        String id,
        String recipientEmail,
        boolean registeredUser,
        String emailType,
        String status,
        String errorCategory,
        String errorMessage,
        String errorDetail,
        String smtpHost,
        Integer smtpPort,
        String fromAddress,
        long durationMs,
        String sentByAdminEmail,
        Instant createdAt
) {
    public static EmailSendLogResponse fromEntity(EmailSendLog log) {
        return new EmailSendLogResponse(
                log.getId(),
                log.getRecipientEmail(),
                log.getRecipientUserId() != null,
                log.getEmailType().name(),
                log.getStatus().name(),
                log.getErrorCategory() == null ? null : log.getErrorCategory().name(),
                log.getErrorMessage(),
                log.getErrorDetail(),
                log.getSmtpHost(),
                log.getSmtpPort(),
                log.getFromAddress(),
                log.getDurationMs(),
                log.getSentByAdminEmail(),
                log.getCreatedAt()
        );
    }
}
