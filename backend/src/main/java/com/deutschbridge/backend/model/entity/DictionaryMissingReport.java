package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A user-flagged lemma with no dictionary entry, logged for later bundled-dataset import. */
@Entity(name = "dictionary_missing_report")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DictionaryMissingReport {
    @Id
    private String id;

    private String lemma;

    @ManyToOne(fetch = FetchType.LAZY)
    private User reportedBy;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
