package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Reservation ledger of the no-repeat rule. Rows are never deleted: abandoning, expiring or cancelling an attempt
 * keeps its exercises consumed. Separate from ordinary Übung activity on purpose.
 */
@Entity
@Table(name = "exam_simulation_usage",
        uniqueConstraints = @UniqueConstraint(name = "uq_exam_sim_usage", columnNames = {"userId", "profileCode", "exerciseId"}))
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationUsage {
    @Id
    private String id;

    @Column(nullable = false)
    private String userId;
    @Column(nullable = false)
    private String profileCode;
    @Column(nullable = false)
    private String exerciseId;
    @Column(nullable = false)
    private String attemptId;
    @Column(nullable = false)
    private String partKey;
    @Column(nullable = false)
    private Instant reservedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
        if (reservedAt == null) reservedAt = Instant.now();
    }
}
