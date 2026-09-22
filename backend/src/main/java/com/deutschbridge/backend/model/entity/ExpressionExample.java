package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExpressionExampleContext;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "expression_examples")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ExpressionExample {
    @Id
    private String id;

    @ManyToOne
    @JsonBackReference("expression-examples")
    private Expression expression;

    @Column(columnDefinition = "TEXT")
    private String sentence;

    @Column(columnDefinition = "TEXT")
    private String translationEn;

    @Column(columnDefinition = "TEXT")
    private String translationFa;

    @Enumerated(EnumType.STRING)
    private ExpressionExampleContext context;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
