package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.enums.PartResultStatus;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.PartResult;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Awaiting assessment until an assessor has provided the official points; never invents a score. */
@Component
public class ManualRubricScorer implements PartScorer {

    @Override
    public PartScoringMethod method() {
        return PartScoringMethod.MANUAL_RUBRIC;
    }

    @Override
    public PartResult score(PartScoringContext ctx) {
        ExamPartConfig part = ctx.part();
        PartScoringContext.Assessment a = ctx.assessment();
        boolean assessed = a != null && a.assessed() && a.points() != null;
        BigDecimal score = assessed ? a.points().setScale(ctx.config().scale(), ctx.config().rounding()) : null;
        return new PartResult(part.key(), part.label(), part.module(), part.section(), part.teil(), PartScoringMethod.MANUAL_RUBRIC,
                part.maxPoints(), score, assessed ? PartResultStatus.SCORED : PartResultStatus.AWAITING_ASSESSMENT,
                0, 0, 0, 0, ctx.completed(), assessed ? a.criteriaScores() : null, assessed ? a.comment() : null);
    }
}
