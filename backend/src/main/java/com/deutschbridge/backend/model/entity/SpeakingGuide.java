package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * The "Mündlicher Ausdruck lernen" content of one Teil at one level: intro, tips, typical mistakes, checklist and the part-specific
 * questions / Redemittel. German only. Exercises link to it instead of repeating it. The JSON shape is validated on save
 * (see ExamSpeakingReader#readGuide).
 */
@Entity(name = "speakingGuides")
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_speaking_guides_level_part", columnNames = {"level", "partNumber"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpeakingGuide {
    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    private int partNumber;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> content;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @PrePersist
    public void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
    }
}
