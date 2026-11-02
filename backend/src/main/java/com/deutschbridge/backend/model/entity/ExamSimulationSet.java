package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExamSetStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One pre-generated exam ("Prüfung 3") of a profile, shared by all learners. Its exercises are in {@link ExamSimulationSetPart}. */
@Entity
@Table(name = "exam_simulation_sets",
        uniqueConstraints = @UniqueConstraint(name = "uq_exam_sim_set_number", columnNames = {"profileCode", "number"}))
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationSet {
    @Id
    private String id;

    @Column(nullable = false)
    private String profileCode;
    @Column(nullable = false)
    private int number;
    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamSetStatus status = ExamSetStatus.DRAFT;

    @Column(nullable = false)
    private Instant createdAt;
    private Instant publishedAt;
    private String createdBy;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
        if (createdAt == null) createdAt = Instant.now();
    }
}
