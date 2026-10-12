package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.AssessmentSource;
import com.deutschbridge.backend.model.enums.AssessmentStatus;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/** Assessment of a manually scored part. Only MANUAL assessments in status ASSESSED are counted into a score. */
@Entity
@Table(name = "exam_simulation_assessments",
        uniqueConstraints = @UniqueConstraint(name = "uq_exam_sim_assessment", columnNames = {"attemptId", "partKey", "source"}),
        indexes = @Index(name = "idx_exam_sim_assessment_status", columnList = "status, createdAt"))
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationAssessment {
    @Id
    private String id;

    @Column(nullable = false)
    private String attemptId;
    @Column(nullable = false)
    private String partKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssessmentSource source = AssessmentSource.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssessmentStatus status = AssessmentStatus.AWAITING;

    /** Rubric criterion key to awarded points. */
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, BigDecimal> criteriaScores;

    @Column(precision = 8, scale = 2)
    private BigDecimal points;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private String assessorId;
    private Instant assessedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
        if (createdAt == null) createdAt = Instant.now();
    }
}
