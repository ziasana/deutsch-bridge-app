package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.List;

@EnableJpaAuditing
@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity (name = "vocabularies")
public class Vocabulary {
    @Id
    private String id;
    @Column(unique = true, nullable = false)
    private String word;
    @Column(columnDefinition = "TEXT")
    private String example;
    private String synonyms;

    @OneToMany(mappedBy = "vocabulary", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<VocabularyContent> vocabularyContents;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Vocabulary(String word, String example, String synonyms, User user) {
        this.word = word;
        this.example = example;
        this.synonyms = synonyms;
        this.user = user;
    }


    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}

