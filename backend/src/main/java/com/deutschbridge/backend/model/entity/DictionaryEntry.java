package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A dictionary headword (lemma) with its senses/examples - shared across every article that
 * contains it. Populated primarily via the offline bundled-dataset import (see
 * scripts/dictionary-import), source = "bundled_dataset".
 */
@Entity(name = "dictionary_entry")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DictionaryEntry {
    @Id
    private String id;

    @Column(unique = true, nullable = false, columnDefinition = "TEXT")
    private String lemma;

    @Column(columnDefinition = "TEXT")
    private String ipa;

    @Column(columnDefinition = "TEXT")
    private String audioUrl;

    /** German grammatical article for nouns: "der"/"die"/"das". Null for non-nouns. */
    private String article;

    private String source;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @JsonManagedReference("entry-senses")
    private List<Sense> senses = new ArrayList<>();

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
