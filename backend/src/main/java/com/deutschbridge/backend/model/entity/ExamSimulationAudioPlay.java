package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** How often an audio clip was played in an attempt; the server-side count behind the profile's play limit. */
@Entity
@Table(name = "exam_simulation_audio_plays",
        uniqueConstraints = @UniqueConstraint(name = "uq_exam_sim_audio_play", columnNames = {"attemptId", "partKey", "passageId"}))
@Getter
@Setter
@NoArgsConstructor
public class ExamSimulationAudioPlay {
    @Id
    private String id;
    @Column(nullable = false)
    private String attemptId;
    @Column(nullable = false)
    private String partKey;
    @Column(nullable = false)
    private String passageId;
    @Column(nullable = false)
    private int plays;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
    }
}
