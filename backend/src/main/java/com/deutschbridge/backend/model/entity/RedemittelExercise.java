package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One practice question written by an admin for a Redemittel. Meaning: optional prompt, the right
 * meaning and wrong ones. Fill-blank: a sentence with ____ and the missing word. Situation: the
 * situation, the fitting expression and wrong ones. Production: the topic to write about.
 */
@Entity(name = "redemittelExercise")
@Table(indexes = @Index(columnList = "phraseId"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedemittelExercise {
    @Id
    private String id;

    private String phraseId;

    @Enumerated(EnumType.STRING)
    private RedemittelExerciseType type;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Column(columnDefinition = "TEXT")
    private String correctAnswer;

    /** One wrong option per line. */
    @Column(columnDefinition = "TEXT")
    private String wrongAnswers;

    private int sortOrder;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
