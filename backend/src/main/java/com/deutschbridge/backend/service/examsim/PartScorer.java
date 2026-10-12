package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.PartResult;

/** Strategy for one {@link PartScoringMethod}. Spring collects all implementations, so adding a method adds no conditional anywhere. */
public interface PartScorer {

    PartScoringMethod method();

    PartResult score(PartScoringContext context);
}
