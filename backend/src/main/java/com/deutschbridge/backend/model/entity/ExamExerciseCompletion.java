package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A user's explicit "I'm done practicing this one" marker for an exam exercise - independent of
 * ExamAttempt (which records every play-through), this is only set when the user clicks
 * "Als erledigt markieren" after seeing their result, so it can be used to filter the exercise list.
 */
@Entity(name = "exam_exercise_completions")
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "exerciseId"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamExerciseCompletion {
    @Id
    private String id;

    private String userId;
    private String exerciseId;
    private LocalDateTime completedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.completedAt == null) {
            this.completedAt = LocalDateTime.now();
        }
    }
}
