package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Mainly used for NOMEN_VERB_VERBINDUNG - e.g. "eine Entscheidung ueber + Akkusativ treffen". Optional for REDEWENDUNG. */
@Entity(name = "expression_patterns")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ExpressionPattern {
    @Id
    private String id;

    @ManyToOne
    @JsonBackReference("expression-patterns")
    private Expression expression;

    private String pattern;

    private String grammarCase;

    private String preposition;

    @Column(columnDefinition = "TEXT")
    private String example;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
