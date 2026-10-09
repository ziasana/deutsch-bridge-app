package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A learner finished one "Mündlicher Ausdruck lernen" station of a Teil at a level, with their best first-try quiz result. */
@Entity(name = "speakingLearnProgress")
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "level", "partNumber", "station"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpeakingLearnProgress {
    @Id
    private String id;

    private String userId;
    private String level;
    private int partNumber;
    private String station;
    private int correct;
    private int total;
    private LocalDateTime completedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
