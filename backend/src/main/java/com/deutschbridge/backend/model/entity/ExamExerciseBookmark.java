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

/** A user's saved/bookmarked exam exercise, shown in the "Saved for later" strip until it is mastered. */
@Entity(name = "exam_exercise_bookmarks")
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "exerciseId"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamExerciseBookmark {
    @Id
    private String id;

    private String userId;
    private String exerciseId;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.createdAt = LocalDateTime.now();
    }
}
