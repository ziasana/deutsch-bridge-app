package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.time.LocalDateTime;
import java.util.Set;

@EnableJpaAuditing
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity (name = "vocabularies")
@ToString(exclude = {"practices", "vocabularyContents"})
public class Vocabulary {
    @Id
    private String id;
    @Column(nullable = false)
    private String word;
    @Column(columnDefinition = "TEXT")
    private String example;
    private String synonyms;
    private LocalDateTime createdAt;
    @OneToMany(mappedBy = "vocabulary", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private Set<VocabularyContent> vocabularyContents;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "vocabulary", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private Set<UserVocabularyPractice> practices;

    public Vocabulary(String word, String example, String synonyms, User user) {
        this.word = word;
        this.example = example;
        this.synonyms = synonyms;
        this.user = user;
    }


    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        createdAt = LocalDateTime.now();
    }
}

