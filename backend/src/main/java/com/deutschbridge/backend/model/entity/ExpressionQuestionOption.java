package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "expression_question_options")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ExpressionQuestionOption {
    @Id
    private String id;

    @ManyToOne
    @JsonBackReference("question-options")
    private ExpressionQuestion question;

    @Column(columnDefinition = "TEXT")
    private String text;

    private boolean correct;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
