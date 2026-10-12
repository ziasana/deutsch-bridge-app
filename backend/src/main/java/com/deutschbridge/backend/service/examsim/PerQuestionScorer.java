package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.PartResultStatus;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.deutschbridge.backend.model.examsim.PartResult;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Points per correct answer. Correctness uses the same rule as the practice flow (trimmed, case-insensitive
 * comparison with the stored answer key); the points come from the profile, never from the client.
 */
@Component
public class PerQuestionScorer implements PartScorer {

    @Override
    public PartScoringMethod method() {
        return PartScoringMethod.PER_QUESTION;
    }

    @Override
    public PartResult score(PartScoringContext ctx) {
        ExamPartConfig part = ctx.part();
        List<ExamQuestion> questions = ctx.exercises().stream().flatMap(e -> e.questionsOrEmpty().stream()).toList();
        int correct = 0;
        int unanswered = 0;
        for (ExamQuestion q : questions) {
            String given = ctx.answers().get(q.getId());
            if (given == null || given.isBlank()) {
                unanswered++;
            } else if (isCorrect(q, given)) {
                correct++;
            }
        }
        int incorrect = questions.size() - correct - unanswered;
        BigDecimal perQuestion = part.pointsPerQuestion() != null ? part.pointsPerQuestion() : BigDecimal.ZERO;
        BigDecimal raw = perQuestion.multiply(BigDecimal.valueOf(correct));
        BigDecimal score = raw.setScale(ctx.config().scale(), ctx.config().rounding());
        return new PartResult(part.key(), part.label(), part.module(), part.section(), part.teil(), PartScoringMethod.PER_QUESTION,
                part.maxPoints(), score, PartResultStatus.SCORED, questions.size(), correct, incorrect, unanswered, false, null, null);
    }

    static boolean isCorrect(ExamQuestion question, String answer) {
        return question.getCorrectAnswer() != null && question.getCorrectAnswer().trim().equalsIgnoreCase(answer.trim());
    }
}
