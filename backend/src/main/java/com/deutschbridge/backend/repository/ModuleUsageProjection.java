package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.LearningModule;

/** Row shape for a per-module usage aggregate: unique learners and activity volume. */
public interface ModuleUsageProjection {
    LearningModule getModule();
    Long getUniqueLearners();
    Long getActivities();
}
