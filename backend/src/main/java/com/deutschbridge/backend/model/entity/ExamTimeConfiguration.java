package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Recommended training time for one Teil of one exam level. These are application training
 * targets, not official per-Teil telc limits.
 */
@Entity
@Table(name = "exam_time_configurations",
        uniqueConstraints = @UniqueConstraint(name = "uk_exam_time_configurations_part",
                columnNames = {"exam_type", "level", "section", "teil"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamTimeConfiguration {
    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false)
    private ExamType examType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LearningLevel level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamSection section;

    /** 1-based Teil number within the section (see ExamTeilResolver). */
    @Column(nullable = false)
    private int teil;

    @Column(name = "recommended_minutes", nullable = false)
    private int recommendedMinutes;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
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
