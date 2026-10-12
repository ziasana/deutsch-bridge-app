package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.AnswerReleasePolicy;
import com.deutschbridge.backend.model.enums.ExamProfileStatus;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.OverallResultPolicy;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A versioned full-exam definition. (code, version) is unique and a version is immutable once it leaves DRAFT:
 * attempts copy the whole profile into their snapshot, so later edits can never change a historical result.
 */
@Entity
@Table(name = "exam_profiles", uniqueConstraints = @UniqueConstraint(name = "uq_exam_profiles_code_version", columnNames = {"code", "version"}))
@Getter
@Setter
@NoArgsConstructor
public class ExamProfile {
    @Id
    private String id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private int version = 1;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String examName;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamType examType = ExamType.TELC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LearningLevel level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamProfileStatus status = ExamProfileStatus.DRAFT;

    @Column(nullable = false)
    private boolean oralScoringEnabled;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal writtenMaxPoints;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal writtenPassThreshold;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal oralMaxPoints;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal oralPassThreshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OverallResultPolicy overallResultPolicy = OverallResultPolicy.WRITTEN_AND_ORAL_REQUIRED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnswerReleasePolicy answerReleasePolicy = AnswerReleasePolicy.AFTER_SUBMISSION;

    /** How often an attempt may be resumed after leaving it; null = unlimited. */
    private Integer maxResumes;

    /** When true, exercises the learner already completed in ordinary Übung are not drawn for the simulation. */
    @Column(nullable = false)
    private boolean excludePracticedExercises;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private ExamProfileConfig config;

    /** Who confirmed the configuration against the official exam documentation (required to publish). */
    @Column(columnDefinition = "TEXT")
    private String verificationNote;

    /** The profile version this one was duplicated from. */
    private String sourceProfileId;

    @Column(nullable = false)
    private Instant createdAt;
    private String createdBy;
    private Instant updatedAt;
    private String updatedBy;
    private Instant publishedAt;
    private String publishedBy;

    public boolean isEditable() {
        return status == ExamProfileStatus.DRAFT;
    }

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }
}
