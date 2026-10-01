package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.WritingGuideKind;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One data-driven learning unit of "Schreiben lernen" for a level. The kind-specific structure
 * lives in {@code data} (JSON text) so new kinds/levels need no schema or UI-component change.
 */
@Entity(name = "writingGuideItems")
@Table(indexes = @Index(columnList = "level, kind"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WritingGuideItem {
    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    @Enumerated(EnumType.STRING)
    private WritingGuideKind kind;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    /** JSON payload, shape depends on {@link #kind}. */
    @Column(columnDefinition = "TEXT")
    private String data;

    private int sortOrder;
    private boolean active = true;

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
