package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One change to the topic list of an exam part's content generator: a CUSTOM topic the admin added (the text itself), or a HIDDEN
 * built-in topic (its token) the admin removed from the list. {@code partKey} is e.g. DTZ_TEIL_5.
 */
@Entity(name = "examGeneratorTopics")
@Table(indexes = @Index(columnList = "partKey"), uniqueConstraints = @UniqueConstraint(columnNames = {"partKey", "kind", "topic"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamGeneratorTopic {
    public static final String CUSTOM = "CUSTOM";
    public static final String HIDDEN = "HIDDEN";

    @Id
    private String id;
    private String partKey;
    private String kind;
    private String topic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ExamGeneratorTopic(String partKey, String kind, String topic) {
        this.partKey = partKey;
        this.kind = kind;
        this.topic = topic;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = NanoIdUtils.randomNanoId();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
