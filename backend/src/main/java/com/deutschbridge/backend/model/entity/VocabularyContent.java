package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity(name="vocabulary_contents")

public class VocabularyContent {
    @Id
    private String id;
    @ManyToOne
    @JoinColumn(name = "vocabulary_id")
    private Vocabulary vocabulary;
    private String meaning;
    private String language;

    public VocabularyContent(Vocabulary vocabulary, String meaning, String language) {
        this.vocabulary = vocabulary;
        this.meaning = meaning;
        this.language = language;
    }


    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}

