package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.enums.PartResultStatus;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.PartResult;
import org.springframework.stereotype.Component;

/** Records only whether the part was completed (e.g. oral practice in profiles without oral scoring). */
@Component
public class UnscoredScorer implements PartScorer {

    @Override
    public PartScoringMethod method() {
        return PartScoringMethod.UNSCORED;
    }

    @Override
    public PartResult score(PartScoringContext ctx) {
        ExamPartConfig part = ctx.part();
        return new PartResult(part.key(), part.label(), part.module(), part.section(), part.teil(), PartScoringMethod.UNSCORED,
                part.maxPoints(), null, PartResultStatus.NOT_SCORED, 0, 0, 0, 0, ctx.completed(), null, null);
    }
}
