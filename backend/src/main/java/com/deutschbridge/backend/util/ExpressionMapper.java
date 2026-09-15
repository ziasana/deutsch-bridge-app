package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionExample;
import com.deutschbridge.backend.model.entity.ExpressionPattern;
import com.deutschbridge.backend.model.entity.ExpressionProgress;
import com.deutschbridge.backend.model.entity.ExpressionQuestion;
import com.deutschbridge.backend.model.entity.ExpressionQuestionOption;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;

public class ExpressionMapper {
    private ExpressionMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    /**
     * userProgress must already be scoped to the current authenticated user (see
     * ExpressionService) - never pass a progress row belonging to a different user. Student-facing
     * callers must use this overload (or pass includeQuestions=false explicitly) - it never
     * includes the question bank, so correct answers can't leak through a student's own network
     * tab. Practice sessions instead get questions through the separate, answer-free
     * PracticeQuestionDto (see ExpressionPracticeService).
     */
    public static ExpressionResponse mapToResponse(Expression e, ExpressionProgress userProgress) {
        return mapToResponse(e, userProgress, false);
    }

    public static ExpressionResponse mapToResponse(Expression e, ExpressionProgress userProgress, boolean includeQuestions) {
        return new ExpressionResponse(
                e.getId(),
                e.getType() != null ? e.getType().name() : null,
                e.getExpression(),
                e.getLevel() != null ? e.getLevel().getValue() : null,
                e.getMeaningDe(),
                e.getMeaningEn(),
                e.getMeaningFa(),
                e.getLiteralMeaning(),
                e.getFigurativeMeaning(),
                e.getGrammarNote(),
                e.getUsageNote(),
                e.getRegister() != null ? e.getRegister().name() : null,
                e.getCommonMistakes(),
                e.getStatus() != null ? e.getStatus().name() : null,
                e.getExamples().stream().map(ExpressionMapper::mapExample).toList(),
                e.getPatterns().stream().map(ExpressionMapper::mapPattern).toList(),
                includeQuestions ? e.getQuestions().stream().map(ExpressionMapper::mapQuestionAdmin).toList() : null,
                userProgress != null ? mapProgress(userProgress) : null
        );
    }

    public static ExpressionResponse mapToAdminResponse(Expression e) {
        return mapToResponse(e, null, true);
    }

    public static ExpressionQuestionAdminDto mapQuestionAdmin(ExpressionQuestion q) {
        return new ExpressionQuestionAdminDto(
                q.getId(),
                q.getType() != null ? q.getType().name() : null,
                q.getFormat() != null ? q.getFormat().name() : null,
                q.getPrompt(),
                q.getExplanation(),
                q.getOptions().stream().map(ExpressionMapper::mapQuestionOptionAdmin).toList()
        );
    }

    public static ExpressionQuestionOptionAdminDto mapQuestionOptionAdmin(ExpressionQuestionOption o) {
        return new ExpressionQuestionOptionAdminDto(o.getId(), o.getText(), o.isCorrect());
    }

    public static ExpressionExampleDto mapExample(ExpressionExample ex) {
        return new ExpressionExampleDto(
                ex.getId(),
                ex.getSentence(),
                ex.getTranslationEn(),
                ex.getTranslationFa(),
                ex.getContext() != null ? ex.getContext().name() : null
        );
    }

    public static ExpressionPatternDto mapPattern(ExpressionPattern p) {
        return new ExpressionPatternDto(
                p.getId(),
                p.getPattern(),
                p.getGrammarCase(),
                p.getPreposition(),
                p.getExample()
        );
    }

    public static ExpressionProgressResponse mapProgress(ExpressionProgress p) {
        double overall = overallScore(p);
        return new ExpressionProgressResponse(
                p.getRecognitionScore(),
                p.getRecallScore(),
                p.getContextScore(),
                p.getTransformationScore(),
                p.getProductionScore(),
                overall,
                p.getReviewCount(),
                p.getCorrectCount(),
                p.getIncorrectCount(),
                p.getMasteryLevel() != null ? p.getMasteryLevel().name() : null,
                p.getLastReviewedAt(),
                p.getNextReviewAt()
        );
    }

    /** Recognition 20% / Recall 25% / Context 15% / Transformation 15% / Production 25%. */
    public static double overallScore(ExpressionProgress p) {
        return p.getRecognitionScore() * 0.20
                + p.getRecallScore() * 0.25
                + p.getContextScore() * 0.15
                + p.getTransformationScore() * 0.15
                + p.getProductionScore() * 0.25;
    }

    /**
     * An expression can't reach MASTERED through recognition/recall alone (spec section 6/14) -
     * it requires a strong production score and several reviews. ACTIVE requires at least one
     * production attempt too: with CONTEXT/COMPLETION/TRANSFORMATION-MCQ now feeding their own
     * axes, a learner could otherwise rack up recognition+recall+context+MCQ-transformation score
     * and cross the overall>=50 bar without ever having tried to produce the expression themselves.
     */
    public static ExpressionMasteryLevel computeMasteryLevel(ExpressionProgress p) {
        double overall = overallScore(p);
        if (p.getProductionScore() >= 80 && overall >= 75 && p.getReviewCount() >= 5) {
            return ExpressionMasteryLevel.MASTERED;
        }
        if (p.getProductionScore() >= 40 || (overall >= 50 && p.getProductionScore() > 0)) {
            return ExpressionMasteryLevel.ACTIVE;
        }
        if (p.getRecallScore() >= 40 || overall >= 25) {
            return ExpressionMasteryLevel.FAMILIAR;
        }
        if (p.getReviewCount() > 0 || p.getRecallScore() > 0 || p.getIncorrectCount() > 0) {
            return ExpressionMasteryLevel.LEARNING;
        }
        return ExpressionMasteryLevel.NEW;
    }
}
