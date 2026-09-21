package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/** Records who changed what in the monetization/entitlement admin settings, and when. */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@EntityListeners(AuditingEntityListener.class)
@Table(name = "admin_audit_logs")
public class AdminAuditLog {

    @Id
    @Column(unique = true, nullable = false)
    private String id;

    @Column(name = "admin_id", nullable = false)
    private String adminId;

    @Column(name = "admin_email", nullable = false)
    private String adminEmail;

    @Column(nullable = false)
    private String action;

    @Column(length = 2000)
    private String details;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = "audit-" + NanoIdUtils.randomNanoId();
        }
    }

    public AdminAuditLog(String adminId, String adminEmail, String action, String details) {
        this.adminId = adminId;
        this.adminEmail = adminEmail;
        this.action = action;
        this.details = details;
    }
}
