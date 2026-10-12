package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "exam_simulation_answers",
        uniqueConstraints = @UniqueConstraint(name = "uq_exam_sim_answer", columnNames = {"attemptId", "partKey", "questionId"}))
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationAnswer {
    @Id
    private String id;

    @Column(nullable = false)
    private String attemptId;
    @Column(nullable = false)
    private String partKey;
    @Column(nullable = false)
    private String questionId;

    @Column(columnDefinition = "TEXT")
    private String answer;

    private boolean flagged;

    /** Client-side ordering stamp: a delayed retry carrying an older stamp never overwrites a newer answer. */
    private long clientTs;

    @Column(nullable = false)
    private Instant savedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
        if (savedAt == null) savedAt = Instant.now();
    }
}
