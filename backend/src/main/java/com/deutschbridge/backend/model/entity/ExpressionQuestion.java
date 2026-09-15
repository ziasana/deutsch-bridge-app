package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExpressionQuestionFormat;
import com.deutschbridge.backend.model.enums.ExpressionQuestionType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * An admin-authored practice question for one expression - CONTEXT (pick the matching situation),
 * COMPLETION (pick the grammatically correct sentence completion), or TRANSFORMATION (rewrite a
 * plain sentence using the expression). CONTEXT/COMPLETION are always multiple-choice; TRANSFORMATION
 * can be either MULTIPLE_CHOICE (admin authors candidate rewrites) or FREE_TEXT (learner writes
 * their own, graded by AI like the Production step - see ExpressionPracticeService).
 */
@Entity(name = "expression_questions")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ExpressionQuestion {
    @Id
    private String id;

    @ManyToOne
    @JsonBackReference("expression-questions")
    private Expression expression;

    @Enumerated(EnumType.STRING)
    private ExpressionQuestionType type;

    @Enumerated(EnumType.STRING)
    private ExpressionQuestionFormat format = ExpressionQuestionFormat.MULTIPLE_CHOICE;

    /** The situation prompt (CONTEXT), the sentence with a blank (COMPLETION), or the plain source sentence (TRANSFORMATION). */
    @Column(columnDefinition = "TEXT")
    private String prompt;

    /** Shown to the learner after they answer, right or wrong. */
    @Column(columnDefinition = "TEXT")
    private String explanation;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("question-options")
    private List<ExpressionQuestionOption> options = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
