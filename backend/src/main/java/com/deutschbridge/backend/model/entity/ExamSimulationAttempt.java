package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.model.examsim.ProfileSnapshot;
import com.deutschbridge.backend.model.examsim.StageState;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** One run of a full exam. The profile snapshot freezes the rules the attempt is scored with. */
@Entity
@Table(name = "exam_simulation_attempts", indexes = {
        @Index(name = "idx_exam_sim_attempts_user", columnList = "userId, startedAt"),
        @Index(name = "idx_exam_sim_attempts_status_deadline", columnList = "status, finalDeadlineAt")
})
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationAttempt {
    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String profileId;
    @Column(nullable = false)
    private String profileCode;
    @Column(nullable = false)
    private int profileVersion;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private ProfileSnapshot profileSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SimulationAttemptStatus status = SimulationAttemptStatus.IN_PROGRESS;

    @Column(nullable = false)
    private Instant startedAt;
    private Instant endedAt;

    /** Upper bound after which nothing can be answered any more: current stage deadline + all remaining stages. */
    @Column(nullable = false)
    private Instant finalDeadlineAt;

    /** Stage timeline: one entry per stage reached so far, the last one is the current stage while IN_PROGRESS. */
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<StageState> stages = new ArrayList<>();

    @Column(nullable = false)
    private int resumeCount;

    /** Set while the learner has paused the exam: the section clock is stopped since this moment. */
    private Instant pausedAt;

    @Column(nullable = false)
    private int pauseCount;

    /** SUBMITTED, TIME_EXPIRED or CANCELLED once finished. */
    private String finishReason;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private ExamResult result;

    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    private long lockVersion;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
        if (startedAt == null) startedAt = Instant.now();
        if (updatedAt == null) updatedAt = startedAt;
    }
}
