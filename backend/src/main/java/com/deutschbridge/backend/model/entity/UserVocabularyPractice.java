package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserVocabularyPractice {
    @Id
    private String id;

    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "vocabulary_id", nullable = false)
    private Vocabulary vocabulary;

    private int knownCount;
    private int unknownCount;

    private int successRate; // 0–100
    private LocalDate lastPracticedAt;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
