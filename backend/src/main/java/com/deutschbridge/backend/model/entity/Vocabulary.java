package com.deutschbridge.backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@Entity(name = "vocabularies")
@NoArgsConstructor
@AllArgsConstructor
@Data

public class Vocabulary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version
    private Integer version;
    private String word;
    private String meaning;
    @Column(columnDefinition = "TEXT")
    private String example;
    private String synonyms;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User userId;

    public Vocabulary(String word, String meaning, String example, String synonyms){
        this.word = word;
        this.meaning = meaning;
        this.example = example;
        this.synonyms = synonyms;
    }
}

