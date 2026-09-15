package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExpressionRegister;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A single Nomen-Verb-Verbindung or Redewendung, the content unit for the active-expressions
 * learning module. Not every field is mandatory - e.g. literalMeaning/figurativeMeaning are
 * mainly used for REDEWENDUNG, grammarNote mainly for NOMEN_VERB_VERBINDUNG.
 */
@Entity(name = "expressions")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Expression {
    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    private ExpressionType type;

    private String expression;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    @Column(columnDefinition = "TEXT")
    private String meaningDe;

    @Column(columnDefinition = "TEXT")
    private String meaningEn;

    @Column(columnDefinition = "TEXT")
    private String meaningFa;

    @Column(columnDefinition = "TEXT")
    private String literalMeaning;

    @Column(columnDefinition = "TEXT")
    private String figurativeMeaning;

    @Column(columnDefinition = "TEXT")
    private String grammarNote;

    @Column(columnDefinition = "TEXT")
    private String usageNote;

    @Enumerated(EnumType.STRING)
    private ExpressionRegister register;

    @Column(columnDefinition = "TEXT")
    private String commonMistakes;

    @Enumerated(EnumType.STRING)
    private ExpressionStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "expression", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("expression-examples")
    private List<ExpressionExample> examples = new ArrayList<>();

    @OneToMany(mappedBy = "expression", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("expression-patterns")
    private List<ExpressionPattern> patterns = new ArrayList<>();

    @OneToMany(mappedBy = "expression", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("expression-questions")
    private List<ExpressionQuestion> questions = new ArrayList<>();

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
