package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExamFieldPresetType;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A named, reusable snippet of text for one of the exam-exercise form's repetitive fields
 * (Teil description / default explanation / default common mistake), scoped to one section +
 * level. Admins manage these per section+level and pick one from a dropdown when authoring an
 * exercise instead of retyping near-identical text - the exercise's own field still just gets a
 * plain-text copy of the preset's value, so it stays freely editable afterward.
 */
@Entity(name = "examFieldPresets")
@Table(indexes = @Index(columnList = "section, level"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamFieldPreset {
    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    private ExamSection section;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    @Enumerated(EnumType.STRING)
    private ExamFieldPresetType fieldType;

    /** Short name shown in the management list and the dropdown option. */
    private String label;

    @Column(columnDefinition = "TEXT")
    private String value;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
