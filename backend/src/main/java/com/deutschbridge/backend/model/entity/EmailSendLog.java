package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.EmailErrorCategory;
import com.deutschbridge.backend.model.enums.EmailSendStatus;
import com.deutschbridge.backend.model.enums.EmailTestType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/** One admin-triggered test email and its outcome. */
@Entity
@NoArgsConstructor
@Data
@EntityListeners(AuditingEntityListener.class)
@Table(name = "email_send_logs")
public class EmailSendLog {

    @Id
    @Column(unique = true, nullable = false)
    private String id;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    /** Null when the admin typed an address that is not a registered user. */
    @Column(name = "recipient_user_id")
    private String recipientUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_type", nullable = false)
    private EmailTestType emailType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmailSendStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "error_category")
    private EmailErrorCategory errorCategory;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    /** Exception chain (class: message), outermost first. */
    @Column(name = "error_detail", length = 4000)
    private String errorDetail;

    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort;

    @Column(name = "from_address")
    private String fromAddress;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs;

    @Column(name = "sent_by_admin_email", nullable = false)
    private String sentByAdminEmail;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = "emaillog-" + NanoIdUtils.randomNanoId();
        }
    }
}
