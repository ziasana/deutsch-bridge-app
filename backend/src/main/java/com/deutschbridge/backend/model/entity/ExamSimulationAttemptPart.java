package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

/** A reserved exercise of an attempt, frozen as an immutable snapshot (including the server-only answer key). */
@Entity
@Table(name = "exam_simulation_attempt_parts",
        uniqueConstraints = @UniqueConstraint(name = "uq_exam_sim_attempt_part", columnNames = {"attemptId", "partKey", "ordinal"}))
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationAttemptPart {
    @Id
    private String id;

    @Column(nullable = false)
    private String attemptId;
    @Column(nullable = false)
    private String partKey;
    @Column(nullable = false)
    private int ordinal;

    @Column(nullable = false)
    private String exerciseId;
    private int exerciseVersion;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private ExerciseSnapshot snapshot;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
    }
}
