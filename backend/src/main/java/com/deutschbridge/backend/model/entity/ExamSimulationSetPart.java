package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** The exercise a set uses for one part. The content is snapshotted per attempt when a learner starts the set. */
@Entity
@Table(name = "exam_simulation_set_parts",
        uniqueConstraints = @UniqueConstraint(name = "uq_exam_sim_set_part", columnNames = {"setId", "partKey", "ordinal"}))
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationSetPart {
    @Id
    private String id;

    @Column(nullable = false)
    private String setId;
    @Column(nullable = false)
    private String partKey;
    @Column(nullable = false)
    private int ordinal;
    @Column(nullable = false)
    private String exerciseId;
    private int exerciseVersion;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
    }
}
