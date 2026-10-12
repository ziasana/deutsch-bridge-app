package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;

/** Append-only audit trail of profile and attempt state transitions. */
@Entity
@Table(name = "exam_simulation_audit", indexes = @Index(name = "idx_exam_sim_audit_subject", columnList = "subjectType, subjectId, occurredAt"))
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationAudit {
    @Id
    private String id;

    @Column(nullable = false)
    private String subjectType;
    @Column(nullable = false)
    private String subjectId;
    @Column(nullable = false)
    private String action;
    private String fromState;
    private String toState;
    /** User id, or SYSTEM for scheduler/clock driven transitions. */
    private String actor;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> details;

    @Column(nullable = false)
    private Instant occurredAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
        if (occurredAt == null) occurredAt = Instant.now();
    }
}
